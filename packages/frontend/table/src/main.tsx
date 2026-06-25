import "./index.scss";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ThemeProvider } from "@grit42/client-library/components";
import { ColumnTypeDefProvider, DataGrid, useSetupTableState } from "@grit42/table";
import { sampleData, sampleDataProperties } from "./data";

const Playground = () => {
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");

  const tableState = useSetupTableState("dummy", sampleDataProperties, {
    settings: {
      enableSelection: true,
      enableColumnDescription: true,
      enableColumnOrderReset: true,
    },
  });

  return (
    <ThemeProvider colorScheme={colorScheme}>
      <ColumnTypeDefProvider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "min-content 1fr",
          height: "100%",
          maxHeight: "100%",
          overflow: "auto",
          width: "100%",
          boxSizing: "border-box",
          gap: "var(--spacing-md)",
          padding: "var(--spacing-md)",
        }}
      >
        <Button
          onClick={() =>
            setColorScheme((scheme) => (scheme === "dark" ? "light" : "dark"))
          }
        >
          Switch to {colorScheme === "dark" ? "light" : "dark"} scheme
        </Button>
        <DataGrid
          header={`Compound registry (${sampleData.length} rows)`}
          tableState={tableState}
          data={sampleData}
        />
      </div>
      </ColumnTypeDefProvider>
    </ThemeProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
