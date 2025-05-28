import { FormFieldDef } from "@grit42/form";
import { NewLoadSetData } from "../types";
import { EntityProperties } from "../../entities";

export const newLoadSetPayload = <
  T extends EntityProperties & { data: string } = NewLoadSetData,
>(
  fields: FormFieldDef[],
  formValue: T,
): FormData => {
  if (!formValue?.name || !formValue?.data) {
    throw new Error("Form value must contain name and data properties");
  }

  const formData = new FormData();
  formData.append(
    "data",
    new File([formValue.data], `${formValue.name}.csv`, {
      type: "text/csv",
    }),
  );
  for (const field of fields) {
    if (!field.name) continue;

    const fieldValue = formValue[field.name as keyof T];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
      const stringValue = String(fieldValue);
      formData.append(field.name, stringValue);
    }
  }
  return formData;
};
