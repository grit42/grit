import {
  AddFormControl,
  Form,
  FormBanner,
  FormFieldDef,
  FormFields,
  useForm,
  useFormInput,
} from "@grit42/form";
import { Button } from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  ColumnDefinitionsFromSheetOptions,
  defaultColumnDefinitionsFromSheetOptions,
  Sheet,
  sheetDefinitionsFromFiles,
} from "@grit42/spreadsheet";
import styles from "./fileLoader.module.scss";
import { CenteredSurface } from "@grit42/client-library/layouts";

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
  const form = useForm({
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

  const BinaryInput = useFormInput("binary");

  return (
    <CenteredSurface>
      <h3 className={styles.header}>
        Data sheet definitions import: select files to analyse
      </h3>
      <p>
        Select one or more spreadsheets (<em>.xlsx, .ods</em>) or
        delimiter-separated value files (<em>.csv, .tsv</em>)
      </p>
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          <form.Field name="files">
            {(field) => (
              <BinaryInput
                disabled={false}
                error=""
                field={
                  {
                    display_name: "Files",
                    name: "files",
                    type: "binary",
                    required: true,
                    multiple: true,
                    className: styles.fileInput,
                  } as FormFieldDef
                }
                handleBlur={field.handleBlur}
                handleChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>
        </FormFields>
        <AddFormControl label="Start import">
          <Button onClick={() => navigate("../../../data-sheets")}>
            Cancel
          </Button>
        </AddFormControl>
      </Form>
    </CenteredSurface>
  );
};

export default FileLoader;
