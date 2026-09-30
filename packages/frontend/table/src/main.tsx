import "./index.scss";
import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ThemeProvider } from "@grit42/client-library/components";
import {
  ColumnTypeDefProvider,
  DataGrid,
  EditedCell,
  Table,
  useSetupTableState,
} from "@grit42/table";
import { sampleData, sampleDataProperties, SampleRow } from "./data";

const Playground = () => {
  const [colorScheme, setColorScheme] = useState<"dark" | "light">("dark");

  // The table never persists an edit itself — it only calls onCellsEdit —
  // so the playground (like any real consumer) owns its own copy of the
  // data and applies the change, mirroring what a real page would do after
  // saving through the edited entity's own endpoint.
  const [rows, setRows] = useState(sampleData);

  const onCellsEdit = useCallback((cells: EditedCell<SampleRow>[]) => {
    // eslint-disable-next-line no-console
    console.log("onCellsEdit", cells);
    setRows((prev) =>
      prev.map((row) => {
        const change = cells.find((cell) => cell.row.id === row.id);
        return change ? { ...row, [change.column]: change.value } : row;
      }),
    );
  }, []);

  const dataGridState = useSetupTableState("dummy-data-grid", sampleDataProperties, {
    settings: {
      enableSelection: true,
      enableColumnDescription: true,
      enableColumnOrderReset: true,
    },
  });

  const tableState = useSetupTableState("dummy-table", sampleDataProperties, {
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
          gridTemplateRows: "min-content 1fr 1fr",
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
          header={`DataGrid: Compound registry (${rows.length} rows)`}
          tableState={dataGridState}
          data={rows}
          editable
          onCellsEdit={onCellsEdit}
        />
        <Table
          header={`Table: Compound registry (${rows.length} rows)`}
          tableState={tableState}
          data={rows}
          editable
          onCellsEdit={onCellsEdit}
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
