import "./index.scss";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Select,
  ThemeProvider,
} from "@grit42/client-library/components";
import { Plot, PlotSettings, PlotDefinition } from "@grit42/plots";
import { DATASETS } from "./datasets";

const DATASET_OPTIONS = DATASETS.map(({ id, label }) => ({
  value: id,
  label,
}));

const Playground = () => {
  const [datasetId, setDatasetId] = useState(DATASETS[0].id);
  const dataset = DATASETS.find((d) => d.id === datasetId) ?? DATASETS[0];
  const [plots, setPlots] = useState<Record<string, PlotDefinition>>({});
  const plot = plots[dataset.id] ?? dataset.plot;
  const setPlot = (next: PlotDefinition) =>
    setPlots((previous) => ({ ...previous, [dataset.id]: next }));

  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");

  return (
    <ThemeProvider colorScheme={colorScheme}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gridTemplateRows: "1fr",
          height: "100%",
          boxSizing: "border-box",
          gap: "var(--spacing-md)",
          padding: "var(--spacing-md)",
        }}
      >
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing)",
            padding: "var(--spacing-lg)",
            overflowY: "auto",
            backgroundColor: "var(--palette-background-surface)",
          }}
        >
          <Button
            onClick={() =>
              setColorScheme((scheme) => (scheme === "dark" ? "light" : "dark"))
            }
          >
            Switch to {colorScheme === "dark" ? "light" : "dark"} scheme
          </Button>
          <Select
            label="Dataset"
            options={DATASET_OPTIONS}
            value={dataset.id}
            isClearable={false}
            description={dataset.description}
            onChange={(id: string) => setDatasetId(id)}
          />
          <PlotSettings
            plot={plot}
            data={dataset.data}
            properties={dataset.properties}
            onChange={setPlot}
          />
        </aside>
        <Plot
          def={plot}
          data={dataset.data}
          dataProperties={dataset.properties}
          onChange={setPlot}
          annotationAuthor="playground"
        />
      </div>
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
