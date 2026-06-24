import AsyncStorage from "@react-native-async-storage/async-storage";
import { downloadBlob, captureTimestamp } from "@/lib/capture/download";

// Single source of truth for what gets backed up.
// Excludes vocal-training:settings:headphones-confirmed-session (ephemeral).
export const BACKUP_KEYS = [
  "vocal-training:sessions:v1",
  "vocal-training:sessions:version",
  "vocal-training:songs:v1",
  "vocal-training:exercises:user:v1",
  "vocal-training:routine:v1",
  "vocal-training:coaching:saved:v1",
  "vocal-training:coaching:rotation:v1",
  "vocal-training:voice-part:v1",
  "vocal-training:octave-shift:v1",
  "vocal-training:guided-tolerance:v1",
  "vocal-training:mode:v1",
  "vocal-training:settings:demo-enabled",
  "vocal-training:onboarding:v1",
] as const;

const LAST_EXPORT_KEY = "vocal-training:backup:last-export";

export type BackupEnvelope = {
  schemaVersion: number;
  exportedAt: string;
  appData: Record<string, string | null>;
};

export async function exportAll(exportedAt: string): Promise<BackupEnvelope> {
  const pairs = await Promise.all(
    BACKUP_KEYS.map(async (k) => [k, await AsyncStorage.getItem(k)] as const),
  );
  const appData: Record<string, string | null> = {};
  for (const [k, v] of pairs) appData[k] = v;
  return { schemaVersion: 1, exportedAt, appData };
}

export async function downloadBackup(): Promise<void> {
  const exportedAt = new Date().toISOString();
  const envelope = await exportAll(exportedAt);
  const blob = new Blob([JSON.stringify(envelope)], { type: "application/json" });
  downloadBlob(blob, `vocal-training-backup__${captureTimestamp()}.json`);
  await AsyncStorage.setItem(LAST_EXPORT_KEY, exportedAt);
}

export async function importAll(
  json: string,
): Promise<{ ok: true; restoredKeys: string[] } | { ok: false; error: string }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "Backup must be a JSON object" };
  }
  const env = parsed as Record<string, unknown>;
  if (typeof env.schemaVersion !== "number") {
    return { ok: false, error: "Missing or invalid schemaVersion" };
  }
  if (env.schemaVersion !== 1) {
    return { ok: false, error: `Unknown schemaVersion: ${env.schemaVersion}` };
  }
  if (typeof env.appData !== "object" || env.appData === null || Array.isArray(env.appData)) {
    return { ok: false, error: "Missing or invalid appData" };
  }
  const appData = env.appData as Record<string, unknown>;
  const backupSet = new Set<string>(BACKUP_KEYS);
  const restoredKeys: string[] = [];
  for (const [k, v] of Object.entries(appData)) {
    if (!backupSet.has(k)) continue;
    if (typeof v === "string") {
      await AsyncStorage.setItem(k, v);
      restoredKeys.push(k);
    }
    // null values are skipped (key was never set in the source app)
  }
  return { ok: true, restoredKeys };
}

export async function lastExportInfo(nowMs: number): Promise<{
  at: string | null;
  ageDays: number | null;
}> {
  const at = await AsyncStorage.getItem(LAST_EXPORT_KEY);
  if (!at) return { at: null, ageDays: null };
  const exportMs = new Date(at).getTime();
  const ageDays = isNaN(exportMs) ? null : (nowMs - exportMs) / (24 * 60 * 60 * 1000);
  return { at, ageDays };
}
