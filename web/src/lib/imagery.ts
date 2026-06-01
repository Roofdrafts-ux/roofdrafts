// ════════════════════════════════════════════════════════════════
// Roofdrafts — IMAGERY PROVIDER (pluggable)
// An estimator traces a roof over licensed aerial imagery. Real
// imagery requires a vendor contract + license key (Nearmap, Vexcel,
// Google, EagleView). Until one is configured we serve a clearly
// labeled MOCK scene so the tool runs in dev.
//
// HARD RULE: mock imagery must NEVER be shipped as a real report.
// Every scene carries `isMock`; the UI surfaces it and delivery must
// refuse to finalize a report traced over a mock scene.
// ════════════════════════════════════════════════════════════════

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ImageryScene {
  /** Provider that produced this scene (e.g. "mock", "nearmap"). */
  provider: string;
  /** True when this is placeholder imagery — not licensed/real. */
  isMock: boolean;
  /** Address the estimator searched for. */
  address: string;
  /** Approx geocoded center (mock providers fabricate this). */
  center: LatLng;
  /** Ground sampling distance: feet of ground per imagery pixel. */
  feetPerPixel: number;
  /** Ground extent of the scene, in feet. */
  widthFt: number;
  heightFt: number;
  /** ISO date the imagery was captured. */
  capturedAt: string;
  /** Raster URL for real providers; null for procedural mock scenes. */
  url: string | null;
  /** Deterministic seed so the mock backdrop is stable per address. */
  seed: number;
}

export interface ImageryProvider {
  readonly name: string;
  readonly isMock: boolean;
  /** Resolve an address to an aerial scene for tracing. */
  fetchScene(address: string): Promise<ImageryScene>;
}

/* ---------- deterministic helpers (stable per address) ---------- */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ════════════════════════════════════════════════════════════════
// MOCK provider — procedural scene, no network, clearly labeled.
// ════════════════════════════════════════════════════════════════
export class MockImageryProvider implements ImageryProvider {
  readonly name = "mock";
  readonly isMock = true;

  async fetchScene(address: string): Promise<ImageryScene> {
    const key = address.trim().toLowerCase() || "unknown";
    const seed = hashString(key);
    // Fabricate a plausible US-ish geocode from the seed.
    const lat = 29 + ((seed % 1500) / 100); // ~29–44 N
    const lng = -123 + (((seed >> 8) % 4800) / 100); // ~-123 to -75 W
    return {
      provider: this.name,
      isMock: true,
      address,
      center: { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 },
      feetPerPixel: 0.5, // typical high-res aerial GSD
      widthFt: 120,
      heightFt: 90,
      capturedAt: "2026-03-18",
      url: null,
      seed,
    };
  }
}

// ════════════════════════════════════════════════════════════════
// Real providers are interface-only seams until contracts + keys
// exist. They intentionally throw so we never silently ship mock
// data dressed up as a real vendor.
// ════════════════════════════════════════════════════════════════
class UnconfiguredProvider implements ImageryProvider {
  constructor(readonly name: string) {}
  readonly isMock = false;
  async fetchScene(): Promise<ImageryScene> {
    throw new Error(
      `Imagery provider "${this.name}" is not configured (missing license key). ` +
        `Set IMAGERY_PROVIDER + the vendor key, or use the mock provider in dev.`,
    );
  }
}

const KNOWN_REAL = ["nearmap", "vexcel", "google", "eagleview"] as const;

/**
 * Resolve the active imagery provider. Defaults to MOCK when no real
 * vendor is configured so the app runs in dev. The selection reads
 * IMAGERY_PROVIDER; real vendors additionally require their key, which
 * is only available server-side — client callers always get the mock.
 */
export function getImageryProvider(): ImageryProvider {
  const choice = (process.env.IMAGERY_PROVIDER || "").trim().toLowerCase();
  if (!choice || choice === "mock") return new MockImageryProvider();
  if ((KNOWN_REAL as readonly string[]).includes(choice)) {
    return new UnconfiguredProvider(choice);
  }
  return new MockImageryProvider();
}
