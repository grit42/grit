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

import { AnyFormApi } from "@tanstack/react-form";
import { classnames } from "@grit42/client-library/utils";
import { formContext } from "./gritFormContext";
import styles from "./form.module.scss";

interface Props {
  form: AnyFormApi;
  children: React.ReactNode;
  className?: string;
}

const Form = ({ form, children, className }: Props) => {
  return (
    <formContext.Provider value={form}>
      <form
        className={classnames(styles.form, className)}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {children}
      </form>
    </formContext.Provider>
  );
};

export default Form;
