/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { ReactNode } from "react";
import {
  Button,
  ButtonGroup,
  Surface,
} from "@grit42/client-library/components";
import styles from "./plots.module.scss";
import { classnames } from "@grit42/client-library/utils";
import { SidebarLayout } from "@grit42/client-library/layouts";

interface Props {
  /** Whether the current user may create/update/delete plots. */
  canCrudPlots: boolean;
  /** Whether the editor is on the "new" (unsaved) plot. */
  isNew: boolean;
  dirty: boolean;
  saving: boolean;
  deleting: boolean;
  onSave: () => void;
  onRevert: () => void;
  onDelete: () => void;
  /** Main plot area (the plot, loading spinner or error). */
  children: ReactNode;
  /** Sidebar settings node (e.g. a data-sheet select + PlotSettings). */
  settings: ReactNode;
}

/**
 * Shared layout for the entity-attached plot editors: a plot area plus a
 * sidebar with the Save/Revert/Delete button group and the settings panel.
 */
const PlotEditorLayout = ({
  canCrudPlots,
  isNew,
  dirty,
  saving,
  deleting,
  onSave,
  onRevert,
  onDelete,
  children,
  settings,
}: Props) => {
  return (
    <SidebarLayout
      className={classnames(styles.plotContainer, {
        [styles.withSidebar]: canCrudPlots,
      })}
      sidebar={
        canCrudPlots ? (
          <Surface className={styles.plotSidebar}>
            <ButtonGroup>
              {dirty && (
                <Button onClick={onSave} loading={saving} color="secondary">
                  {isNew ? "Add" : "Save"}
                </Button>
              )}
              {dirty && <Button onClick={onRevert}>Revert</Button>}
              {!isNew && (
                <Button onClick={onDelete} color="danger" loading={deleting}>
                  Delete
                </Button>
              )}
            </ButtonGroup>
            {settings}
          </Surface>
        ) : undefined
      }
    >
      {children}
    </SidebarLayout>
  );
};

export default PlotEditorLayout;
