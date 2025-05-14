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
import { DeepKeys, FormApi, Validator } from "@tanstack/react-form";

export type FormData = Record<string, any>;

type SubmitFnProps<
  TFormData extends FormData,
  TFormValidator extends Validator<TFormData, unknown> | undefined = undefined,
> = {
  value: TFormData;
  formApi: FormApi<TFormData, TFormValidator>;
};

type SubmitFn<
  TFormData extends FormData,
  TFormValidator extends Validator<TFormData, unknown> | undefined = undefined,
> = (props: SubmitFnProps<TFormData, TFormValidator>) => any | Promise<any>;

export function genericErrorHandler<
  TFormData extends FormData,
  TFormValidator extends Validator<TFormData, unknown> | undefined = undefined,
>(submitFn: SubmitFn<TFormData, TFormValidator>) {
  return async (props: SubmitFnProps<TFormData, TFormValidator>) => {
    try {
      await submitFn(props);
    } catch (e) {
      if (typeof e === "string") {
        props.formApi.setErrorMap({ onSubmit: e });
      } else if (typeof e === "object") {
        for (const key in e) {
          if (props.formApi.getFieldMeta(key as DeepKeys<TFormData>)) {
            props.formApi.setFieldMeta(key as DeepKeys<TFormData>, (m) => ({
              ...m,
              errors: (e as Record<string, string[]>)[key],
              errorMap: {
                onSubmit: (e as Record<string, string[]>)[key].join("\n"),
              },
            }));
          }
        }
      } else {
        throw e;
      }
    }
  };
}
