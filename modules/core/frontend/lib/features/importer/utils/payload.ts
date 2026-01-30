import { NewLoadSetData } from "../types";

export const newLoadSetPayload = (
  formValue: NewLoadSetData,
): FormData => {
  const formData = new FormData();
  formData.append("name", formValue.name);
  formData.append("entity", formValue.entity);
  formData.append("origin_id", formValue.origin_id.toString());

  formValue.blocks.forEach((block, index) => {
    formData.append(`blocks[${index}][name]`, block.name);
    formData.append(`blocks[${index}][separator]`, block.separator);
    formData.append(
      `blocks[${index}][data]`,
      new File([block.data], `${formValue.name}.txt`, {
        type: "text/plain",
      }),
    );
  });

  // formData.append(
  //   "data",
  //   new File([formValue.data], `${formValue.name}.csv`, {
  //     type: "text/csv",
  //   }),
  // );
  // for (const field of fields) {
  //   if (!field.name) continue;

  //   const fieldValue = formValue[field.name as keyof T];
  //   if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
  //     const stringValue = String(fieldValue);
  //     formData.append(field.name, stringValue);
  //   }
  // }
  return formData;
};
