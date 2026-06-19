import "./index.scss";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ThemeProvider } from "@grit42/client-library/components";
import { Plot, PlotSettings, PlotDefinition } from "@grit42/plots";
import { sampleData, sampleDataProperties } from "./data";

const INITIAL_PLOT: PlotDefinition = {
  type: "scatter",
  title: "Concentration (µM) : Response (%)",
  x: { key: "concentration", label: "Concentration (µM)", axisType: "log" },
  y: { key: "response", label: "Response (%)", axisType: "linear" },
  groupBy: ["compound"],
};

const Playground = () => {
  const [plot, setPlot] = useState<PlotDefinition>(INITIAL_PLOT);
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
          <PlotSettings
            plot={plot}
            properties={sampleDataProperties}
            onChange={setPlot}
          />
        </aside>
        <Plot
          def={plot}
          data={sampleData}
          dataProperties={sampleDataProperties}
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
