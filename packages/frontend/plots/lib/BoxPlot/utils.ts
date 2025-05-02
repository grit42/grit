import { SourceDataProperties } from "../types";

export const getBoxPlotTitle = (
  yAxis: string,
  groupBy: string[],
  yAxisProperties: SourceDataProperties,
  groupByProperties: SourceDataProperties,
) => {
  const axisProperty = yAxisProperties.find(({ name }) => name === yAxis);
  if (groupBy.length === 0)
    return `${axisProperty?.display_name ?? axisProperty?.name ?? yAxis}`;
  const groupedByProperties = groupByProperties.filter(({ name }) =>
    groupBy.includes(name),
  );
  return `${axisProperty?.display_name ?? axisProperty?.name} : ${groupedByProperties.map(({ name, display_name }) => display_name ?? name).join(", ")}`;
};
