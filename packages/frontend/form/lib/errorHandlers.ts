/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/form.
 *
 * @grit42/form is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/form is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/form. If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyFormApi, DeepKeys } from "@tanstack/react-form";
import { toast } from "@grit42/notifications";

export type FormData = Record<string, any>;

type SubmitFnProps<TFormData extends FormData> = {
  value: TFormData;
  formApi: AnyFormApi;
};

type SubmitFn<TFormData extends FormData> = (
  props: SubmitFnProps<TFormData>,
) => any | Promise<any>;

export function genericErrorHandler<TFormData extends FormData>(
  submitFn: SubmitFn<TFormData>,
) {
  return async (props: SubmitFnProps<TFormData>) => {
    try {
      await submitFn(props);
    } catch (e) {
      if (typeof e === "string") {
        // (The API's notifyOnError already shows such errors as a toast.)
        props.formApi.setErrorMap({ onSubmit: e });
      } else if (typeof e === "object") {
        // Errors on a field go to that field. The rest (e.g. Rails' `base`,
        // errors about the record as a whole) are shown above the form,
        // instead of being dropped.
        const formErrors: string[] = [];
        for (const key in e) {
          const messages = [(e as Record<string, string[] | string>)[key]].flat();
          if (props.formApi.getFieldMeta(key as DeepKeys<TFormData>)) {
            props.formApi.setFieldMeta(key as DeepKeys<TFormData>, (m) => ({
              ...m,
              errors: messages,
              errorMap: {
                onSubmit: messages.join("\n"),
              },
            }));
          } else {
            formErrors.push(
              ...messages.map((message) =>
                key === "base" ? message : `${key}: ${message}`,
              ),
            );
          }
        }
        // A toast as well, as the banner and the fields may be out of view
        // (notifyOnError only toasts plain string errors).
        if (formErrors.length) {
          props.formApi.setErrorMap({ onSubmit: formErrors.join("\n") });
          toast.error(formErrors.join("\n"));
        } else {
          toast.error("Please check the highlighted fields");
        }
      } else {
        throw e;
      }
    }
  };
}
