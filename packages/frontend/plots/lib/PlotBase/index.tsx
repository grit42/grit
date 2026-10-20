import { Spinner } from "@grit42/client-library/components";
import { lazy, Suspense } from "react";
import type { PlotParams } from "./types";

// Lazy, to keep Plotly out of the initial bundle.
const LazyPlotlyChart = lazy(() => import("./PlotlyChart"));

const PlotBase = (props: PlotParams) => {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyPlotlyChart {...props} />
    </Suspense>
  );
};

export default PlotBase;
