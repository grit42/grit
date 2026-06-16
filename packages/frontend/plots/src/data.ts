import { SourceData, SourceDataProperties } from "@grit42/plots";

export const sampleDataProperties: SourceDataProperties = [
  { name: "compound", display_name: "Compound", type: "text" },
  { name: "batch", display_name: "Batch", type: "text" },
  {
    name: "concentration",
    display_name: "Concentration (µM)",
    type: "decimal",
  },
  { name: "response", display_name: "Response (%)", type: "decimal" },
  { name: "measured_at", display_name: "Measured at", type: "datetime" },
];

const COMPOUNDS = [
  { name: "GRT-0001", ic50: 0.05, hill: 1.2 },
  { name: "GRT-0002", ic50: 0.4, hill: 0.9 },
  { name: "GRT-0003", ic50: 2.5, hill: 1.5 },
  { name: "GRT-0004", ic50: 8, hill: 1 },
];

const BATCHES = ["A", "B"];

const CONCENTRATIONS = [0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10];

// Deterministic pseudo-noise so the dataset is stable across HMR updates
const noise = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

const BASE_TIME = Date.parse("2026-06-01T08:00:00Z");

const generateSampleData = (): SourceData => {
  const data: SourceData = [];
  let i = 0;
  for (const compound of COMPOUNDS) {
    for (const batch of BATCHES) {
      for (const concentration of CONCENTRATIONS) {
        const inhibition =
          100 /
          (1 + Math.pow(compound.ic50 / concentration, compound.hill)) +
          noise(i) * 5;
        data.push({
          compound: compound.name,
          batch,
          concentration,
          response: Math.round(inhibition * 100) / 100,
          measured_at: new Date(BASE_TIME + i * 30 * 60 * 1000).toISOString(),
        });
        i++;
      }
    }
  }
  return data;
};

export const sampleData = generateSampleData();
