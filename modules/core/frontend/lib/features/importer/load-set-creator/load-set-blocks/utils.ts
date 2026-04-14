import { parse } from "papaparse";
import { GritColumnDef } from "@grit42/table";
import {
  PendingLoadSetBlock,
  PendingLoadSetBlockPreview,
} from "../LoadSetCreatorContext";
import { toSafeIdentifier } from "../../../../utils";
import { FormFieldDef } from "@grit42/form";

export const newLoadSetPayload = (
  formValue: any,
  loadSetFields: FormFieldDef[],
  loadSetBlockFields: FormFieldDef[],
): FormData => {
  const formData = new FormData();
  formData.append("name", formValue.name);
  formData.append("entity", formValue.entity);
  formData.append("origin_id", formValue.origin_id.toString());

  for (const field of loadSetFields) {
    if (!field.name) continue;

    const fieldValue = formValue[field.name];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
      const stringValue = String(fieldValue);
      formData.append(field.name, stringValue);
    }
  }

  formValue.blocks.forEach((block: any, index: number) => {
    formData.append(`load_set_blocks[${index}][name]`, formValue.name);
    formData.append(`load_set_blocks[${index}][separator]`, block.separator);
    formData.append(`load_set_blocks[${index}][data]`, block.file);

    for (const field of loadSetBlockFields) {
      if (!field.name) continue;

      const fieldValue = formValue.blocks[index][field.name];
      if (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== ""
      ) {
        const stringValue = String(fieldValue);
        formData.append(
          `load_set_blocks[${index}][${field.name}]`,
          stringValue,
        );
      }
    }
  });
  return formData;
};

export const dsvSampleData = (
  block: PendingLoadSetBlock,
): Promise<PendingLoadSetBlockPreview> => {
  return new Promise((resolve, reject) => {
    parse<Record<string, string>>(
      new File([block.file.slice(0, 1024 * 1024)], block.file.name),
      {
        delimiter: block.separator ?? "",
        header: true,
        preview: 100,
        skipEmptyLines: true,
        complete: (result) => {
          const sampleData = result.data;
          const headers = result.meta.fields ?? [];
          const sampleDataColumns: GritColumnDef<Record<string, string>>[] =
            headers.map((field) => ({
              id: toSafeIdentifier(field),
              header: field,
              accessorKey: field,
            }));
          resolve({ sampleData, sampleDataColumns });
        },
        error: reject,
      },
    );
  });
};
