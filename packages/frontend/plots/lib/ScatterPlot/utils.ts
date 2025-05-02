import { SourceDataProperties } from "../types";

export const getScatterPlotTitle = (
  xAxis: string,
  yAxis: string,
  xAxisProperties: SourceDataProperties,
  yAxisProperties: SourceDataProperties,
) => {
  const xAxisProperty = xAxisProperties.find(({ name }) => name === xAxis);
  const yAxisProperty = yAxisProperties.find(({ name }) => name === yAxis);
  return `${xAxisProperty?.display_name ?? xAxisProperty?.name ?? xAxis} : ${yAxisProperty?.display_name ?? yAxisProperty?.name ?? yAxis}`;
};
