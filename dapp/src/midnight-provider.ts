declare global {
  interface Window {
    cardano?: { midnight?: any };
    midnight?: Record<string, any>;
  }
}

export function getMidnightProvider(): any | null {
  const m: any = (window as any)?.midnight;
  if (m && typeof m === "object") {
    if (m.mnLace) return m.mnLace;
    if (m.lace) return m.lace;
    const k = Object.keys(m).find((x) => m[x] && typeof m[x] === "object");
    if (k) return m[k];
  }
  return (window as any)?.cardano?.midnight ?? null;
}