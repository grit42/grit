/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/form.
 *
 * @grit/form is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/form is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/form. If not, see <https://www.gnu.org/licenses/>.
 */

import { createContext, useContext } from "react";
import { FormInputProps } from "./types";

interface FormInputProviderContextValue {
  inputs: Record<string, React.FunctionComponent<FormInputProps>>;
  register: (
    type: string,
    input: React.FunctionComponent<FormInputProps>,
  ) => () => void;
}

const defaultContextValue: FormInputProviderContextValue = {
  inputs: {},
  register: () => {
    throw "No registration function provided";
  },
};

const FormInputProviderContext = createContext(defaultContextValue);

export const useFormInputContext = () => useContext(FormInputProviderContext);
export const useFormInputs = () => useContext(FormInputProviderContext).inputs;
export const useFormInput = (type: string) => {
  const inputs = useContext(FormInputProviderContext).inputs;
  return inputs[type] ?? inputs["default"];
};

export const useRegisterFormInput = () =>
  useContext(FormInputProviderContext).register;

export default FormInputProviderContext;
