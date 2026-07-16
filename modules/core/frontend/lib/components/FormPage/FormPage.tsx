/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { PropsWithChildren, ReactNode } from "react";
import { classnames } from "@grit42/client-library/utils";
import styles from "./formPage.module.scss";
import FormPageForm from "./FormPageForm";
import FormPageAction from "./FormPageAction";
import FormPageBody from "./FormPageBody";
import FormPageHeader from "./FormPageHeader";

export type FormPageProps = PropsWithChildren<{
  header?: ReactNode;
  className?: string;
}>;

const FormPage = (props: FormPageProps) => {
  return (
    <div className={classnames(styles.formPage, props.className)}>
      {props.header}
      {props.children}
    </div>
  );
};

FormPage.Body = FormPageBody;
FormPage.Header = FormPageHeader;
FormPage.Action = FormPageAction;
FormPage.Form = FormPageForm;

export default FormPage;
