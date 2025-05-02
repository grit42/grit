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

import styles from "./form.module.scss";
import { Button, ButtonGroup } from "@grit/client-library/components";
import { ReactFormExtendedApi } from "@tanstack/react-form";

interface Props<T> {
  form: ReactFormExtendedApi<T>;
  cancelLabel?: string;
  deleteLabel?: string;
  showCancel?: boolean;
  showDelete?: boolean;
  onCancel?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  isCancelling?: boolean;
  isDeleting?: boolean;
  style?: React.CSSProperties;
}

const FormControls = <T,>({
  form,
  showCancel,
  cancelLabel = "Cancel",
  onCancel,
  showDelete,
  deleteLabel = "Delete",
  isCancelling,
  onDelete,
  isDeleting,
  style,
}: Props<T>) => {
  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
      children={([canSubmit, isSubmitting, isDirty]) => {
        return (
          <div
            style={{
              ...(style ?? {}),
              display: isDirty || showDelete || showCancel ? undefined : "none",
            }}
            className={styles.controls}
          >
            <ButtonGroup>
              {isDirty && (
                <Button
                  color="secondary"
                  disabled={!canSubmit}
                  type="submit"
                  loading={isSubmitting}
                >
                  Save
                </Button>
              )}
              {isDirty && (
                <Button onClick={() => form.reset()}>Revert changes</Button>
              )}
              {showCancel && !isDirty && (
                <Button onClick={onCancel} loading={isCancelling}>{cancelLabel}</Button>
              )}
              {showDelete && (
                <Button color="danger" onClick={onDelete} loading={isDeleting}>
                  {deleteLabel}
                </Button>
              )}
            </ButtonGroup>
          </div>
        );
      }}
    />
  );
};

export default FormControls;
