import { LoadSetBlockDataUpdateData, NewLoadSetData } from "../types";

export const newLoadSetPayload = (formValue: NewLoadSetData): FormData => {
  const formData = new FormData();
  formData.append("name", formValue.name);
  formData.append("entity", formValue.entity);
  formData.append("origin_id", formValue.origin_id.toString());

  formValue.load_set_blocks.forEach((block, index) => {
    formData.append(`load_set_blocks[${index}][name]`, block.name);
    formData.append(`load_set_blocks[${index}][separator]`, block.separator);
    formData.append(
      `load_set_blocks[${index}][data]`,
      new File([block.data], `${formValue.name}.txt`, {
        type: "text/plain",
      }),
    );
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
