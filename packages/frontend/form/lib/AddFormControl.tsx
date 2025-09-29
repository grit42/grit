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
import styles from "./form.module.scss";
import { Button, ButtonGroup } from "@grit42/client-library/components";
import { PropsWithChildren } from "react";

interface Props<T> {
  form: ReactFormExtendedApi<T>;
  label?: string;
  style?: React.CSSProperties;
}

const AddFormControl = <T,>({
  form,
  label,
  style,
  children,
}: PropsWithChildren<Props<T>>) => (
  <form.Subscribe
    selector={(state) => [state.canSubmit, state.isSubmitting]}
    children={([canSubmit, isSubmitting]) => (
      <div style={style} className={styles.controls}>
        <ButtonGroup>
          <Button
            color="secondary"
            disabled={!canSubmit}
            type="submit"
            loading={isSubmitting}
          >
            {label ?? "Save"}
          </Button>
          {children}
        </ButtonGroup>
      </div>
    )}
  />
);

export default AddFormControl;
