import {
  AddFormControl,
  BinaryFormFieldDef,
  Form,
  FormBanner,
  FormField,
  FormFields,
  useForm,
  useFormInput,
} from "@grit42/form";
import { CenteredSurface } from "@grit42/client-library/layouts";
import { z } from "zod";
import {
  isSpreadSheet,
  useLoadSetCreatorContext,
} from "../LoadSetCreatorContext";
import styles from "./fileLoader.module.scss";
import { LoadSetData } from "../../types/load_sets";
import { Button } from "@grit42/client-library/components";
import { Link } from "react-router-dom";

const MAX_SPREADSHEET_SIZE_MB = 10;

const FilesLoader = () => {
  const {
    entityInfo,
    setFiles,
    files,
    loadSetFields,
    loadSet,
    setLoadSet,
    presets,
  } = useLoadSetCreatorContext();

  const form = useForm({
    defaultValues: {
      ...loadSet,
      ...presets,
      files,
    },
    validators: {
      onMount: z.object({
        files: z.array(z.file()).min(1),
      }),
      onChange: z.object({
        files: z
          .array(z.file())
          .min(1, "Select one or more files")
          .superRefine((files, ctx) => {
            if (files.some(isSpreadSheet) && files.length > 1) {
              ctx.addIssue({
                code: "custom",
                message: `Spreadsheet import is limited to one file.`,
              });
              return;
            }
            const oversized = files.filter(
              (file) =>
                isSpreadSheet(file) &&
                file.size > MAX_SPREADSHEET_SIZE_MB * 1024 ** 2,
            );
            if (oversized.length > 0) {
              ctx.addIssue({
                code: "custom",
                message: `The following spreadsheet file(s) exceed ${MAX_SPREADSHEET_SIZE_MB} MB: ${oversized.map((f) => f.name).join(", ")}. Export individual sheets as CSV files to load large data sets.`,
              });
            }
          }),
      }),
    },
    onSubmit: async ({ value }) => {
      setFiles(value.files);
      const loadSetValue = {
        ...value,
      } satisfies Partial<LoadSetData> as Partial<LoadSetData>;
      delete loadSetValue.files;
      setLoadSet(loadSetValue);
    },
  });

  const BinaryInput = useFormInput("binary");

  return (
    <CenteredSurface className={styles.container}>
      <h2>Import {entityInfo.plural}</h2>
      <p>
        Select text files (.csv, .tsv, .txt, ...), or one spreadsheet file
        (.xlsx, .xls, .ods)
      </p>
      <Form form={form}>
        <FormFields columns={1}>
          {loadSetFields
            .filter((f) => f.name !== "entity")
            .map((f) => (
              <FormField fieldDef={f} key={f.name} />
            ))}
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
                  } as BinaryFormFieldDef
                }
                handleBlur={field.handleBlur}
                handleChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.errorMap.onChange?.files}>
            {(errors) =>
              errors && (
                <FormBanner
                  content={errors
                    .map(({ message }: { message: string }) => message)
                    .join("\n")}
                />
              )
            }
          </form.Subscribe>
        </FormFields>
        <AddFormControl label="Start">
          <Link to="/">
            <Button>Cancel</Button>
          </Link>
        </AddFormControl>
      </Form>
    </CenteredSurface>
  );
};

export default FilesLoader;
