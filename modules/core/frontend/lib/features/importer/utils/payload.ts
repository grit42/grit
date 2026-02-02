import { FormFieldDef } from "@grit42/form";
import { LoadSetBlockDataUpdateData, NewLoadSetData } from "../types";

export const newLoadSetPayload = (
  formValue: NewLoadSetData,
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

  formValue.load_set_blocks.forEach((block, index) => {
    formData.append(`load_set_blocks[${index}][name]`, block.name);
    formData.append(`load_set_blocks[${index}][separator]`, block.separator);
    formData.append(
      `load_set_blocks[${index}][data]`,
      new File([block.data], `${formValue.name}.txt`, {
        type: "text/plain",
      }),
    );

    for (const field of loadSetBlockFields) {
      if (!field.name) continue;

      const fieldValue = formValue.load_set_blocks[index][field.name];
      console.log(formValue, `load_set_blocks[${index}][${field.name}]`, fieldValue)
      if (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== ""
      ) {
        const stringValue = String(fieldValue);
        formData.append(`load_set_blocks[${index}][${field.name}]`, stringValue);
      }
    }
  });
  return formData;
};

export const updateLoadSetBlockDataPayload = (
  formValue: LoadSetBlockDataUpdateData,
): FormData => {
  const formData = new FormData();
  formData.append("name", formValue.name);
  formData.append("separator", formValue.separator);
  formData.append(
    `data`,
    new File([formValue.data], `${formValue.name}.txt`, {
      type: "text/plain",
    }),
  );
  return formData;
};
