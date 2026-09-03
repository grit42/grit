import { Select } from "@grit42/client-library/components";
import { PlotDefinition } from "../types";
import { AxisType } from "plotly.js";

const AxesTypeSettings = <TPlot extends PlotDefinition>({
  plot,
  onChange,
  axes = "both",
}: {
  plot: TPlot;
  onChange: (plot: TPlot) => void;
  axes?: "both" | "x" | "y";
}) => {
  const onAxisTypeChange = (axis: "x" | "y") => (axisType: AxisType) => {
    onChange({ ...plot, [axis]: { ...plot[axis], axisType } });
  };

  return (
    <>
      {(axes === "both" || axes === "x") && (
        <Select
          label="X axis type"
          options={[
            {
              value: "linear",
              label: "Linear",
            },
            {
              value: "log",
              label: "Log\u2081\u2080",
            },
            {
              value: "category",
              label: "Category",
            },
            {
              value: "date",
              label: "Date",
            },
          ]}
          value={plot.x?.axisType}
          onChange={onAxisTypeChange("x")}
        />
      )}
      {(axes === "both" || axes === "y") && (
        <Select
          label="Y axis type"
          options={[
            {
              value: "linear",
              label: "Linear",
            },
            {
              value: "log",
              label: "Log\u2081\u2080",
            },
          ]}
          value={plot.y.axisType}
          onChange={onAxisTypeChange("y")}
        />
      )}
    </>
  );
};

export default AxesTypeSettings;
