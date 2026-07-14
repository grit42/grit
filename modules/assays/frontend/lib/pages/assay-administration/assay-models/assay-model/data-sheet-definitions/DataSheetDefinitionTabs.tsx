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

import {
  Button,
  ButtonGroup,
  ErrorPage,
} from "@grit42/client-library/components";
import { AssayDataSheetDefinitionData } from "../../../../../queries/assay_data_sheet_definitions";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";
import { Link, NavLink, Outlet } from "react-router-dom";
import styles from "./dataSheetDefinitions.module.scss";
import { classnames } from "@grit42/client-library/utils";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
}

const DataSheetDefinitionTabs = ({ sheetDefinitions }: Props) => {
  const { canEdit } = useAssayModelEditorContext();

  if (!canEdit && sheetDefinitions.length === 0) {
    return <ErrorPage error="This model does not define any data sheets" />;
  }

  const hasSheets = sheetDefinitions.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Data sheets</h1>
        {canEdit && hasSheets && (
          <ButtonGroup>
            <Link to="new">
              <Button>New data sheet</Button>
            </Link>
            <Link to="import">
              <Button>Import data sheets</Button>
            </Link>
          </ButtonGroup>
        )}
      </div>
      <div
        className={classnames(styles.dataSheets, {
          [styles.withTabs]: hasSheets,
        })}
      >
        {hasSheets && (
          <nav className={styles.tabs}>
            <ul className={styles.tabContainer}>
              {sheetDefinitions.map(({ id, name }) => (
                <li key={id}>
                  <NavLink to={id.toString()}>
                    <div className={styles.indicator}></div>
                    <span>{name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default DataSheetDefinitionTabs;
