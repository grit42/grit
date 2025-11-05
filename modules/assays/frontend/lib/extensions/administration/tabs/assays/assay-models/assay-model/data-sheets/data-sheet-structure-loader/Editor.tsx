import {
  Form,
  FormControls,
  FormField,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import structureFromFiles from "../../../../../../../../tools/spreadsheet-structure";
import { useCreateEntityMutation, useEntityData } from "@grit42/core";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { AssayDataSheetDefinitionData } from "../../../../../../../../queries/assay_data_sheet_definitions";
import { AssayDataSheetColumnData } from "../../../../../../../../queries/assay_data_sheet_columns";
import { toast } from "@grit42/notifications";
import { useEffect, useState } from "react";
import { useQuery } from "@grit42/api";

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

const DataSheetStructureEditor = ({
  assayModelId,
  files,
}: {
  assayModelId: string;
  files: File[];
}) => {
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
    queryKey: ["structures"],
    queryFn: async () => {
      return await structureFromFiles(files, dataTypes ?? []);
    },
    enabled: !!dataTypes,
  });

  if (isLoading || isStructureLoading) {
    return <Spinner />;
  }

  if (isError || isStructureError) {
    return <ErrorPage error={error ?? structureError?.message} />;
  }

  return (
    <Surface>
      <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Check structure
      </h2>
      <ButtonGroup>
        <Button onClick={() => navigate("..")}>Back</Button>
      </ButtonGroup>
      <ul>
        {structures?.map((structure) => (
          <li key={structure.name}>
            <span>{structure.name}</span>
            <ul>
              {structure.colDefs.map((def) => (
                <li key={def.name}>
                  {def.name} {def.safe_name} {def.data_type_id}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Surface>
  );
};

export default DataSheetStructureEditor;
