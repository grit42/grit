import { useEntityData } from "@grit42/core";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Tabs,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@grit42/api";
import {
  sampleSheetData,
  sheetDefinitionsFromFiles,
  Sheet,
  utils,
} from "@grit42/spreadsheet";
import { GritColumnDef, Table } from "@grit42/table";
import { useMemo, useState } from "react";
import styles from "./dataSheetStructureLoader.module.scss";

// const createSheetDefinitionMutation =
//   useCreateEntityMutation<AssayDataSheetDefinitionData>(
//     "grit/assays/assay_data_sheet_definitions",
//   );

// const createSheetColumnMutation =
//   useCreateEntityMutation<AssayDataSheetColumnData>(
//     "grit/assays/assay_data_sheet_columns",
//   );

// const form = useForm<{ files: File[] }>({
//   defaultValues: { files: [] },
//   onSubmit: genericErrorHandler(async ({ value: formValue }) => {
//     const t = toast.loading("Importing...");
//     const sheets = await structureFromFiles(formValue.files, dataTypes ?? []);
//     let sheetId;

//     for (const sheet of sheets) {
//       const assayDataSheetDefinition =
//         await createSheetDefinitionMutation.mutateAsync({
//           assay_model_id: assayModelId,
//           name: sheet.name,
//         });

//       sheetId = sheetId ?? assayDataSheetDefinition.id;

//       for (const col of sheet.colDefs) {
//         await createSheetColumnMutation.mutateAsync({
//           assay_data_sheet_definition_id: assayDataSheetDefinition.id,
//           name: col.name,
//           safe_name: col.safe_name,
//           data_type_id: col.data_type_id,
//           required: false,
//         });
//       }
//     }

//     toast.dismiss(t);

//     navigate(`../${sheetId}`);
//   }),
// });

const SheetPreview = ({ sheet }: { sheet: Sheet }) => {
  const sampleData = useMemo(
    () => sampleSheetData(sheet).map((d, i) => ({ ...d, rowIndex: i + 1 })),
    [sheet],
  );
  const sampleDataColumns = useMemo(() => {
    const columns: GritColumnDef[] = [
      {
        id: "rowIndex",
        header: "",
        accessorKey: "rowIndex",
        size: 40,
        type: "integer",
      },
    ];
    for (let i = 0; i <= sheet.range.e.c; i++) {
      const alphaCol = utils.encode_col(i);
      columns.push({
        id: alphaCol,
        header: alphaCol,
        accessorKey: alphaCol,
      });
    }
    return columns;
  }, [sheet]);

  return (
    <div style={{overflow: "auto"}}>
    <Table
      columns={sampleDataColumns}
      data={sampleData}
      settings={{
        disableFilters: true,
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableVisibilitySettings: true,
      }}
    />
    </div>
  );
};

const DataSheetStructureEditor = ({
  files,
}: {
  assayModelId: string;
  files: File[];
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();
  const {
    data: dataTypes,
    isLoading,
    isError,
    error,
  } = useEntityData("grit/core/data_types");

  const {
    data: structures,
    isLoading: isStructureLoading,
    isError: isStructureError,
    error: structureError,
  } = useQuery({
    queryKey: ["structures", files],
    queryFn: async () => {
      return await sheetDefinitionsFromFiles(files);
    },
    enabled: !!dataTypes,
  });

  if (isLoading || isStructureLoading) {
    console.log("yoooooo")
    return <Spinner />;
  }

  if (isError || isStructureError) {
    return <ErrorPage error={error ?? structureError?.message} />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
        width: "100%",
        overflow: "auto"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
          Check structure
        </h2>
        <ButtonGroup>
          <Button onClick={() => navigate("..")}>Cancel</Button>
          <Button color="primary" onClick={() => navigate("..")}>
            Continue
          </Button>
        </ButtonGroup>
      </div>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.tab}
        tabs={
          structures?.map((s) => ({
            panelProps: {
              style: { overflow: "auto"}
            },
            key: s.name,
            name: s.name,
            panel: <SheetPreview sheet={s} />,
          })) ?? []
        }
      />
    </div>
  );
};

export default DataSheetStructureEditor;
