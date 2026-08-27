/**
 * Datasets the playground can plot.
 */
import type {
  PlotDefinition,
  SourceData,
  SourceDataProperties,
} from "@grit42/plots";
import { sampleData, sampleDataProperties } from "./data";
import {
  sendBodyWeights,
  sendBodyWeightsProperties,
  sendClinicalObservations,
  sendClinicalObservationsProperties,
  sendLabs,
  sendLabsProperties,
  sendSubjects,
  sendSubjectsProperties,
} from "../test/fixtures/send";

export interface Dataset {
  id: string;
  label: string;
  description: string;
  data: SourceData;
  properties: SourceDataProperties;
  plot: PlotDefinition;
}

export const DATASETS: Dataset[] = [
  {
    id: "dose-response",
    label: "Dose response (synthetic)",
    description: "Four compounds across a concentration series.",
    data: sampleData,
    properties: sampleDataProperties,
    plot: {
      type: "scatter",
      title: "Concentration (µM) : Response (%)",
      x: { key: "concentration", axisType: "log" },
      y: { key: "response", axisType: "linear" },
      groupBy: ["compound"],
      export: { control: "button" },
    },
  },
  {
    /**
     * The closest generic equivalent of SDTM's TimePlot: a measurement over
     * study day, grouped by dose and split by sex. Worth comparing side by side
     * with `TestTimePlot` when deciding what the two should share.
     */
    id: "send-bw",
    label: "SEND: body weight over time",
    description: "Body weight by study day, per dose group. 600 rows.",
    data: sendBodyWeights,
    properties: sendBodyWeightsProperties,
    plot: {
      type: "timeseries",
      title: "Body weight over study day",
      x: { key: "BWDY", axisType: "linear" },
      y: { key: "BWSTRESN", axisType: "linear" },
      groupBy: ["ARM"],
      export: { control: "button" },
    },
  },
  {
    id: "send-bw-sex",
    label: "SEND: body weight, faceted by sex",
    description: "The same series, with sex as a facet rather than a wrapper.",
    data: sendBodyWeights,
    properties: sendBodyWeightsProperties,
    plot: {
      type: "timeseries",
      title: "Body weight over study day",
      x: { key: "BWDY", axisType: "linear" },
      y: { key: "BWSTRESN", axisType: "linear" },
      groupBy: ["ARM"],
      facetBy: ["SEX"],
      export: { control: "button" },
    },
  },
  {
    id: "send-bw-bar",
    label: "SEND: body weight by dose group",
    description:
      "Group means with error bars; add the observations in Display.",
    data: sendBodyWeights,
    properties: sendBodyWeightsProperties,
    plot: {
      type: "bar",
      title: "Body weight by dose group",
      x: { key: "ARM", axisType: "category" },
      y: { key: "BWSTRESN", axisType: "linear" },
      export: { control: "button" },
    },
  },
  {
    id: "send-lb",
    label: "SEND: lab results",
    description: "Haematology and chemistry with reference ranges. 360 rows.",
    data: sendLabs,
    properties: sendLabsProperties,
    plot: {
      type: "box",
      title: "Lab result by test",
      x: { key: "LBTEST", axisType: "category" },
      y: { key: "LBSTRESN", axisType: "linear" },
      groupBy: ["LBTEST"],
      export: { control: "button" },
    },
  },
  {
    id: "send-cl",
    label: "SEND: clinical observations",
    description: "Categorical findings and severities; no numeric y at all.",
    data: sendClinicalObservations,
    properties: sendClinicalObservationsProperties,
    plot: {
      type: "box",
      title: "Findings by severity",
      x: { key: "CLSEV", axisType: "category" },
      y: { key: "CLDY", axisType: "linear" },
      groupBy: ["CLSEV"],
      export: { control: "button" },
    },
  },
  {
    id: "send-dm",
    label: "SEND: subjects",
    description: "One row per animal: age, species, strain, arm.",
    data: sendSubjects,
    properties: sendSubjectsProperties,
    plot: {
      type: "box",
      title: "Age by arm",
      x: { key: "ARM", axisType: "category" },
      y: { key: "AGE", axisType: "linear" },
      groupBy: ["ARM"],
      export: { control: "button" },
    },
  },
];
