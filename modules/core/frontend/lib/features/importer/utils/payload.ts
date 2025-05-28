import { FormFieldDef } from "@grit42/form";
import { NewLoadSetData } from "../types";
import { EntityProperties } from "../../entities";

export const newLoadSetPayload = <
  T extends EntityProperties & { data: string } = NewLoadSetData,
>(
  fields: FormFieldDef[],
  formValue: T,
): FormData => {
  const formData = new FormData();
  formData.append(
    "data",
    new File([formValue.data], `${formValue.name}.csv`, {
      type: "application/csv",
    }),
  );
  for (const field of fields) {
   if (!field.name) continue;
    const stringValue = formValue[field.name]?.toString();
    if (stringValue) formData.append(field.name, stringValue);
  }
  return formData;
};
