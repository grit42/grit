import type {
  PlotDefinition,
  SourceData,
  SourceDataProperties,
} from "@grit42/plots";
import {
  awkwardData,
  awkwardDataProperties,
  sampleData,
  sampleDataProperties,
} from "./data";
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

export interface DatasetGuide {
  what: string;
  markLabel: string;
  mark: string;
}

export interface Dataset {
  id: string;
  label: string;
  description: string;
  data: SourceData;
  properties: SourceDataProperties;
  plot: PlotDefinition;
  /** What the data summary counts. */
  recordLabel: string;
  guide: DatasetGuide;
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
    },
    recordLabel: "wells",
    guide: {
      what: "Each compound's response across its concentrations.",
      markLabel: "A point",
      mark: "One well: its response at one concentration.",
    },
  },
  {
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
    },
    recordLabel: "weighings",
    guide: {
      what: "Body weight over the study, per dose group.",
      markLabel: "A point",
      mark: "One animal weighed on one study day.",
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
      facetOrder: ["M", "F"],
    },
    recordLabel: "weighings",
    guide: {
      what: "Body weight over the study, per dose group and sex.",
      markLabel: "A point",
      mark: "One animal weighed on one study day.",
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
    },
    recordLabel: "weighings",
    guide: {
      what: "Body weight per dose group.",
      markLabel: "A bar",
      mark: "The group's mean, with the error bars set in Display.",
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
    },
    recordLabel: "results",
    guide: {
      what: "Each lab test's results across the animals.",
      markLabel: "A box",
      mark: "The test's median and quartiles.",
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
    },
    recordLabel: "observations",
    guide: {
      what: "When findings of each severity were seen.",
      markLabel: "A box",
      mark: "The study days of one severity's findings.",
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
    },
    recordLabel: "animals",
    guide: {
      what: "Age per arm.",
      markLabel: "A box",
      mark: "The arm's median and quartiles.",
    },
  },
  {
    id: "awkward",
    label: "Awkward values (synthetic)",
    description:
      "40 sites on two plates, with missing, empty and non-positive values.",
    data: awkwardData,
    properties: awkwardDataProperties,
    plot: {
      type: "bar",
      title: "Value by site",
      x: { key: "site", axisType: "category" },
      y: { key: "value", axisType: "log" },
      groupBy: ["plate"],
    },
    recordLabel: "rows",
    guide: {
      what: "Mean value per site and plate.",
      markLabel: "A bar",
      mark: "One site's mean on one plate.",
    },
  },
];
