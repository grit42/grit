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

import { ReactFormExtendedApi } from "@tanstack/react-form";
import { classnames } from "@grit42/client-library/utils";
import styles from "./form.module.scss";

interface Props<T> {
  form: ReactFormExtendedApi<T>;
  children: React.ReactNode;
  className?: string;
}

const Form = <T,>(props: Props<T>) => {
  return (
    <form
      className={classnames(styles.form, props.className)}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.form.handleSubmit();
      }}
    >
      {props.children}
    </form>
  );
};

export default Form;
