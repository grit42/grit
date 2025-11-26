import {
  AddFormControl,
  Form,
  FormField,
  FormFieldDef,
  useForm,
} from "@grit42/form";
import { Button, Surface } from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import z from "zod";
import {
  ColumnDefinitionsFromSheetOptions,
  defaultColumnDefinitionsFromSheetOptions,
  Sheet,
  sheetDefinitionsFromFiles,
} from "@grit42/spreadsheet";

export interface SheetWithOptions extends Sheet {
  columnDefinitionsFromSheetOptions: ColumnDefinitionsFromSheetOptions;
  include: boolean;
}

const FileLoader = ({
  files,
  setFiles,
  setSheets,
}: {
  assayModelName: string;
  files: File[];
  setFiles: (files: File[]) => void;
  setSheets: (sheets: SheetWithOptions[]) => void;
}) => {
  const navigate = useNavigate();
  const form = useForm<{ files: File[] }>({
    defaultValues: { files },
    validators: {
      onMount: z.object({ files: z.array(z.file()).min(1) }),
      onChange: z.object({ files: z.array(z.file()).min(1) }),
    },
    onSubmit: async ({ value }) => {
      setSheets(
        (await sheetDefinitionsFromFiles(value.files)).map((s) => ({
          ...s,
          columnDefinitionsFromSheetOptions:
            defaultColumnDefinitionsFromSheetOptions,
          include: true,
        })),
      );
      setFiles(value.files);
      navigate("../map");
    },
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "min-content 1fr",
      }}
    >
      <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Data sheet definitions import: select files to analyse
      </h3>
      <Surface>
        <p>
          Select one or more spreadsheets (<em>.xlsx, .ods</em>) or
          delimiter-separated value files (<em>.csv, .tsv</em>)
        </p>
        <Form<{ files: File[] }> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridAutoRows: "max-content",
              gap: "calc(var(--spacing) * 2)",
              paddingBottom: "calc(var(--spacing) * 2)",
            }}
          >
            {form.state.errorMap.onSubmit && (
              <div
                style={{
                  gridColumnStart: 1,
                  gridColumnEnd: -1,
                  color: "var(--palette-error-main)",
                }}
              >
                {form.state.errorMap.onSubmit?.toString()}
              </div>
            )}
            <FormField
              form={form}
              fieldDef={
                {
                  display_name: "Files",
                  name: "files",
                  type: "binary",
                  required: true,
                  multiple: true,
                } as FormFieldDef
              }
            />
          </div>
          <AddFormControl form={form} label="Start import">
            <Button onClick={() => navigate("../..")}>Cancel</Button>
          </AddFormControl>
        </Form>
      </Surface>
    </div>
  );
};

export default FileLoader;
