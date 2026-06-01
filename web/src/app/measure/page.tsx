import { MeasureTool } from "@/components/measure/MeasureTool";

export const metadata = {
  title: "Measure tool — Roofdrafts",
  description: "Estimator roof tracing over aerial imagery (internal).",
};

// NOTE: estimator-only surface. Server-side role guard (Auth.js, role=estimator)
// lands with the auth phase; until then the route is open in dev.
export default function MeasurePage() {
  return <MeasureTool />;
}
