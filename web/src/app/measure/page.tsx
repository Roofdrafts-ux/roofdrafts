import { MeasureTool } from "@/components/measure/MeasureTool";
import { requireRole } from "@/lib/auth-helpers";

export const metadata = {
  title: "Measure tool — Roofdrafts",
  description: "Estimator roof tracing over aerial imagery (internal).",
};

// Internal estimator-only tool. force-dynamic so the server-side role guard always
// runs (a statically-prerendered page would be served straight from the CDN, bypassing
// the proxy/middleware — which is how this route was publicly reachable before).
export const dynamic = "force-dynamic";

export default async function MeasurePage() {
  await requireRole("ESTIMATOR"); // redirects non-estimators (server-side RBAC)
  return <MeasureTool />;
}
