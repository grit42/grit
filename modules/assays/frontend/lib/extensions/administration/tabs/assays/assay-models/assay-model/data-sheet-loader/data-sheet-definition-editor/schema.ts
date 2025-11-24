import z from "zod";
import { AssayDataSheetDefinitionData } from "../../../../../../../../queries/assay_data_sheet_definitions";

export const dataSheetColumnDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>().trim().nonempty(),
  description: z.nullish(z.string().trim()),
  assay_data_sheet_definition_id: z.int(),
  assay_data_sheet_definition_id__name: z.string().trim().nonempty(),
  safe_name: z.coerce
    .string<string>()
    .trim()
    .nonempty()
    .regex(
      /^[a-z_]{2}/,
      "should start with two lowercase letters or underscores",
    )
    .regex(
      /^[a-z0-9_]*$/,
      "should contain only lowercase letters, numbers and underscores",
    ),
  required: z.nullish(z.boolean()),
  data_type_id: z.int(),
  data_type_id__name: z.string().trim().nonempty(),
  unit_id: z.nullish(z.int()),
  unit_id__name: z.nullish(z.string().trim()),
  sort: z.nullish(z.coerce.number<number>().int()),
});

export const dataSheetDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>().trim().nonempty(),
  description: z.nullish(z.string().trim()),
  assay_model_id: z.int(),
  assay_model_id__name: z.string().trim().nonempty(),
  result: z.nullish(z.boolean()),
  sort: z.nullish(z.coerce.number<number>().int()),
  columns: z
    .array(dataSheetColumnDefinitionSchema)
    .superRefine((items, ctx) => {
      const uniqueSafeNames = new Map<string, number>();
      const uniqueNames = new Map<string, number>();
      let duplicateSafeNames = false;
      let duplicateNames = false;
      items.forEach((item, idx) => {
        const firstSafeNameAppearanceIndex = uniqueSafeNames.get(
          item.safe_name,
        );
        if (firstSafeNameAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique within a data sheet`,
            path: [idx, "safe_name"],
          });
          if (!duplicateSafeNames) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique within a data sheet`,
              path: [firstSafeNameAppearanceIndex, "safe_name"],
            });
            duplicateSafeNames = true;
          }
        } else {
          uniqueSafeNames.set(item.safe_name, idx);
        }
        const firstNameAppearanceIndex = uniqueNames.get(item.name);
        if (firstNameAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique within a data sheet`,
            path: [idx, "name"],
          });
          if (!duplicateNames) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique within a data sheet`,
              path: [firstNameAppearanceIndex, "name"],
            });
            duplicateNames = true;
          }
        } else {
          uniqueNames.set(item.name, idx);
        }
      });
    }),
});

const dataSetDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>(),
  description: z.nullish(z.coerce.string<string>().trim()),
  sheets: z.array(dataSheetDefinitionSchema).superRefine((items, ctx) => {
    const uniqueValues = new Map<string, number>();
    let duplicateSheetName = false;
    items.forEach((item, idx) => {
      const firstAppearanceIndex = uniqueValues.get(item.name);
      if (firstAppearanceIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `must be unique within an assay model`,
          path: [idx, "name"],
        });
        if (!duplicateSheetName) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique within an assay model`,
            path: [firstAppearanceIndex, "name"],
          });
          duplicateSheetName = true;
        }
      }
      uniqueValues.set(item.name, idx);
    });
  }),
});

export const refinedDataSetDefinitionSchema = (
  assayModelDataSheets: AssayDataSheetDefinitionData[],
) =>
  dataSetDefinitionSchema.superRefine((dataSetDefinition, ctx) => {
    dataSetDefinition.sheets.forEach((item, idx) => {
      if (assayModelDataSheets.find(({ name }) => name === item.name)) {
        ctx.addIssue({
          code: "custom",
          message: "is already taken by an existing data sheet",
          path: ["sheets", idx, "name"],
        });
      }
    });
  });

export default dataSetDefinitionSchema;
