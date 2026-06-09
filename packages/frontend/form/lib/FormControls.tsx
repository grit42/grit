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

import styles from "./form.module.scss";
import { Button, ButtonGroup } from "@grit42/client-library/components";
import { PropsWithChildren } from "react";
import { useFormContext } from "./gritFormContext";
import { classnames } from "@grit42/client-library/utils";

interface Props {
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

const FormControls = ({
  showCancel,
  cancelLabel = "Cancel",
  onCancel,
  showDelete,
  deleteLabel = "Delete",
  isCancelling,
  onDelete,
  isDeleting,
  style,
  children,
}: PropsWithChildren<Props>) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
      children={([canSubmit, isSubmitting, isDirty]) => {
        return (
          <div
            style={style}
            className={classnames(styles.controls, {
              [styles.hidden]: !(isDirty || showDelete || showCancel),
            })}
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
                <Button onClick={onCancel} loading={isCancelling}>
                  {cancelLabel}
                </Button>
              )}
              {showDelete && (
                <Button color="danger" onClick={onDelete} loading={isDeleting}>
                  {deleteLabel}
                </Button>
              )}
              {children}
            </ButtonGroup>
          </div>
        );
      }}
    />
  );
};

export default FormControls;
