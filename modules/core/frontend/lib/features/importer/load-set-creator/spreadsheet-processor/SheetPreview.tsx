import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorPage, LoadingPage } from "@grit42/client-library/components";
import { AnyFormApi, useStore } from "@grit42/form";
import { Row, Table, GritColumnDef } from "@grit42/table";
import { useSheetSampleData } from "./useSheetSampleData";
import SheetOptionDropdown from "./SheetOptionsDropdown";

const SheetPreviewContent = ({
  sampleData,
  sampleDataColumns,
  setFieldValue,
}: {
  sampleData: Record<string, any>[];
  sampleDataColumns: GritColumnDef<Record<string, any>>[];
  setFieldValue: (field: string, value: string | number) => void;
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

  const onCellClick = useMemo(
    () =>
      [
        sampleDataColumns
          .filter(({ id }) => id !== "rowIndex")
          .map(({ id }) => id) ?? [],
        (
          row: Row<Record<string, any>>,
          column: string,
          cellRef: HTMLTableCellElement,
          _cellData: any,
          event: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
        ) => {
          if (focusedCellRef.current == cellRef) {
            focusedCellRef.current = null;
            setFocusedCellInfo(null);
          } else {
            focusedCellRef.current = cellRef;
            setFocusedCellInfo({ row: row.original.rowIndex, column });
          }
          event.stopPropagation();
        },
      ] as [
        columns: string[],
        callback: (row: Row<Record<string, any>>, columnName: string) => void,
      ],
    [sampleDataColumns],
  );

  return (
    <>
      <SheetOptionDropdown
        focusedCellInfo={focusedCellInfo}
        setFocusedCellInfo={setFocusedCellInfo}
        focusedCellRef={focusedCellRef}
        setFieldValue={setFieldValue}
      />
      <Table
        onCellClick={onCellClick}
        columns={sampleDataColumns}
        data={sampleData}
        settings={{
          disableColumnReorder: true,
          disableColumnSorting: true,
          disableFilters: true,
          disableVisibilitySettings: true,
        }}
      />
    </>
  );
};

const SheetPreview = ({
  sheetIndex,
  form,
}: {
  sheetIndex: number;
  form: AnyFormApi;
}) => {
  const [id, file, separator] = useStore(
    form.baseStore,
    (state): [string, File, string] => [
      state.values.sheets[sheetIndex].id,
      state.values.sheets[sheetIndex].file,
      state.values.sheets[sheetIndex].separator,
    ],
  );
  const { data, isLoading, isError, error } = useSheetSampleData(
    id,
    file,
    separator,
  );

  const setFieldValue = (field: string, value: string | number) => {
    (form as any).setFieldValue(
      `sheets[${sheetIndex}].${field}` as any,
      value as any,
    );
  };

  if (isLoading) {
    return <LoadingPage message={"Loading preview..."} />;
  }

  if (isError || !data || !data.sampleData || !data.sampleDataColumns) {
    return <ErrorPage error={error?.message} />;
  }

  return (
    <SheetPreviewContent
      sampleData={data.sampleData}
      sampleDataColumns={data.sampleDataColumns}
      setFieldValue={setFieldValue}
    />
  );
};

export default SheetPreview;
