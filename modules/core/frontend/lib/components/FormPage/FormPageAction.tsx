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

import { Button } from "@grit42/client-library/components";
import { PropsWithChildren } from "react";
import styles from "./formPage.module.scss";

export type FormPageActionProps<T = unknown> = PropsWithChildren<{
  title: string;
  actionLabel: string;
  onAction: () => Promise<T>;
}>;

const FormPageAction = ({
  children,
  title,
  actionLabel,
  onAction,
}: FormPageActionProps) => {
  return (
    <div className={styles.actionSection}>
      <div className={styles.actionContent}>
        <h3>{title}</h3>
        {typeof children === "string" ? <p>{children}</p> : children}
      </div>
      <Button onClick={onAction} color="danger">
        {actionLabel}
      </Button>
    </div>
  );
};

export default FormPageAction;
