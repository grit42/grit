import { Spinner } from "@grit/client-library/components";
import { lazy, Suspense } from "react";
import { PlotParams } from "react-plotly.js";

const LazyPlotlyPlot = lazy(() => import("react-plotly.js"));

const PlotBase = (props: PlotParams) => {
    return <Suspense fallback={<Spinner />}>
        <LazyPlotlyPlot {...props}/>
    </Suspense>
}

export default PlotBase;
