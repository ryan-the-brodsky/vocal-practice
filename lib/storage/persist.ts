// Browser Storage API wrappers for persistence prompts + usage estimates.
// All navigator.storage calls are guarded — safe on native (returns safe defaults).

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function persistedStatus(): Promise<{
  persisted: boolean;
  usageBytes?: number;
  quotaBytes?: number;
}> {
  try {
    const storage = navigator.storage;
    if (!storage) return { persisted: false };
    const [persisted, estimate] = await Promise.all([
      storage.persisted(),
      storage.estimate?.() ?? Promise.resolve({}),
    ]);
    return {
      persisted,
      usageBytes: (estimate as StorageEstimate).usage,
      quotaBytes: (estimate as StorageEstimate).quota,
    };
  } catch {
    return { persisted: false };
  }
}
