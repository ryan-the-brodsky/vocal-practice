// Browser-only file download for the dev raw-capture pipeline. Guarded on
// document/URL so a stray native call is a harmless no-op.

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Filename-safe ISO timestamp (drops the bits an OS dislikes in filenames).
export function captureTimestamp(d = new Date()): string {
  return d.toISOString().replace(/[:.]/g, "-");
}
