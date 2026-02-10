import {
  Button,
  ButtonGroup,
  Tabs,
  Tooltip,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import {
  EndpointError,
  EndpointErrorErrors,
  EndpointSuccess,
  request,
  useMutation,
} from "@grit42/api";
import {
  sampleSheetData,
  Sheet,
  Column,
  columnDefinitionsFromSheet,
} from "@grit42/spreadsheet";
import { useEffect, useRef, useState } from "react";
import styles from "../dataSheetStructureLoader.module.scss";
import { Form, useForm } from "@grit42/form";
import SheetPreview from "./SheetPreview";
import SheetOptions from "./SheetOptions";
import SheetOptionDropdown from "./SheetOptionDropdown";
import { SheetWithOptions } from "../FileLoader";

const useDataTypeGuessMutation = () => {
  return useMutation({
    mutationKey: ["data_type_guess"],
    mutationFn: async (columns: any) => {
      const response = await request<
        EndpointSuccess<any>,
        EndpointError<EndpointErrorErrors<any>>
      >("/grit/core/data_types/guess_data_type_for_columns", {
        method: "POST",
        data: { columns },
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
  });
};

export interface SheetWithColumns extends Sheet {
  columns: Column[];
  sort?: number;
}

const SheetMapper = ({
  sheets,
  setSheetsWithOptions,
  setSheetsWithColumns,
}: {
  sheets: SheetWithOptions[];
  setSheetsWithOptions: (sheets: SheetWithOptions[]) => void;
  setSheetsWithColumns: (sheets: SheetWithColumns[]) => void;
}) => {
  const [focusedCellInfo, setFocusedCellInfo] = useState<{
    row: number;
    column: string;
  } | null>(null);
  const focusedCellRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    if (!focusedCellInfo) return;
    const cell = focusedCellRef.current;
    const parentDiv = cell?.closest("div");

    const clearCellInfo = () => {
      setFocusedCellInfo(null);
      focusedCellRef.current = null;
    };

    const clearCellInfoIfNotInView = () => {
      const parentRect = parentDiv?.getBoundingClientRect();
      const cellRect = cell?.getBoundingClientRect();

      const isCellVisible =
        parentRect &&
        cellRect &&
        cellRect.right < parentRect.right &&
        cellRect.left > parentRect.left &&
        cellRect.top > parentRect.top &&
        cellRect.bottom < parentRect.bottom;
      if (!isCellVisible) {
        setFocusedCellInfo(null);
        focusedCellRef.current = null;
      }
    };

    document.addEventListener("click", clearCellInfo);
    document.addEventListener("scroll", clearCellInfoIfNotInView, true);
    return () => {
      document.removeEventListener("click", clearCellInfo);
      document.removeEventListener("scroll", clearCellInfoIfNotInView, true);
    };
  }, [focusedCellInfo]);

  const dataTypeGuessMutation = useDataTypeGuessMutation();

  const form = useForm({
    defaultValues: {
      sheets,
    },
    validators: {
      onChange: ({ value }) =>
        !value.sheets.some(({ include }) => include)
          ? "Include at least one sheet"
          : undefined,
    },
    onSubmit: async ({ value }) => {
      const sheetsWithColumns = await Promise.all(
        value.sheets
          .filter((s) => s.include)
          .map(async (s, sIndex) => ({
            ...s,
            sort: sIndex,
            sample_data: sampleSheetData(s),
            columns: (
              await columnDefinitionsFromSheet(
                s,
                s.columnDefinitionsFromSheetOptions,
              )
            ).map((c, cIndex) => ({
              ...c,
              sort: cIndex,
            })),
          })) ?? [],
      );

      const string_columns_samples: any = {};
      sheetsWithColumns.forEach((s) =>
        s.columns
          .filter(({ detailed_data_type }) => detailed_data_type == "string")
          .forEach(({ excel_column, id }) => {
            string_columns_samples[id] = s.sample_data
              .slice(1)
              .map((s) => s[excel_column as string]);
          }),
      );

      const res = (
        await dataTypeGuessMutation.mutateAsync(string_columns_samples)
      ).reduce((acc: any, d: any) => ({ ...acc, [d.column_id]: d }), {});

      sheetsWithColumns.forEach((s) => {
        s.columns.forEach((c) => {
          if (res[c.id.toString()]) {
            c.detailed_data_type = res[c.id.toString()].data_type_name;
          }
        });
      });

      setSheetsWithOptions(value.sheets);
      setSheetsWithColumns(sheetsWithColumns);
      navigate(`../edit`);
    },
  });

  const setFieldValue = (field: string, value: string | number) => {
    form.setFieldValue(`sheets[${selectedTab}].${field}` as any, value);
  };

  const handleCellClick = (
    row: number,
    column: string,
    cellRef: HTMLTableCellElement,
    _: any,
    event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
  ) => {
    if (focusedCellRef.current == cellRef) {
      focusedCellRef.current = null;
      setFocusedCellInfo(null);
    } else {
      focusedCellRef.current = cellRef;
      setFocusedCellInfo({ row, column });
    }
    event.stopPropagation();
  };

  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <SheetOptionDropdown
        focusedCellInfo={focusedCellInfo}
        setFocusedCellInfo={setFocusedCellInfo}
        focusedCellRef={focusedCellRef}
        setFieldValue={setFieldValue}
      />
      <Form form={form} className={styles.sheetMapperContainer}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
            Data sheet definitions import: choose sheets to import and provide
            information about their structure
          </h3>

          <ButtonGroup>
            <Button onClick={() => navigate("../files")}>Back to loader</Button>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
                errors: state.errors,
              })}
              children={({ canSubmit, isSubmitting, errors }) => (
                <div className={styles.controls}>
                  <ButtonGroup>
                    <Tooltip
                      disabled={!errors.length}
                      content={errors.join("\n")}
                    >
                      <Button
                        color="secondary"
                        disabled={!canSubmit}
                        type="submit"
                        loading={isSubmitting}
                      >
                        Continue
                      </Button>
                    </Tooltip>
                  </ButtonGroup>
                </div>
              )}
            />
          </ButtonGroup>
        </div>
        <Tabs
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          className={styles.tab}
          tabs={
            sheets.map((s, index) => ({
              panelProps: {
                style: { overflow: "auto" },
              },
              key: s.name,
              name: s.name,
              panel: (
                <div
                  style={{
                    overflow: "auto",
                    display: "grid",
                    gridTemplateColumns: "max-content 1fr",
                    gridTemplateRows: "1fr",
                    gap: "var(--spacing)",
                    height: "100%",
                  }}
                >
                  <SheetOptions form={form} sheetIndex={index} sheet={s} />
                  <SheetPreview sheet={s} onCellClick={handleCellClick} />
                </div>
              ),
            })) ?? []
          }
        />
      </Form>
    </>
  );
};

export default SheetMapper;
