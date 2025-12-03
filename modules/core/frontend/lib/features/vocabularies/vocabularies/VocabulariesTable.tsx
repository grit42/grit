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

import { Table, useSetupTableState } from "@grit42/table";
import { useCallback, useEffect } from "react";
import { useToolbar } from "../../../Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import { useTableColumns } from "../../../utils";
import { useVocabularies, useVocabularyColumns } from "../queries/vocabularies";
import styles from "./vocabularies.module.scss";
import { useHasRoles } from "../../session";

const VocabulariesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canEditVocabularies = useHasRoles([
    "Administrator",
    "VocabularyAdministrator",
  ]);
  const { pathname } = useLocation();
  const { data: vocabularyColumns } = useVocabularyColumns();

  const vocabulariesTableColumns = useTableColumns(vocabularyColumns);

  const tableState = useSetupTableState(
    "vocabularies-tables",
    vocabulariesTableColumns,
    {
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
      initial: {
        sorting: [
          {
            id: "name",
            desc: false,
          },
        ],
        sizing: {
          name: 500,
          description: 750,
        },
      },
    },
  );

  const { data: vocabularies } = useVocabularies(
    tableState.sorting,
    tableState.filters,
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New vocabulary",
          onClick: navigateToNew,
          disabled: canEditVocabularies,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname, canEditVocabularies]);

  return (
    <div className={styles.vocabularies}>
      <Table
        tableState={tableState}
        header="Vocabularies"
        headerActions={
          canEditVocabularies ? (
            <Button onClick={navigateToNew}>New</Button>
          ) : undefined
        }
        className={styles.typesTable}
        data={vocabularies}
        onRowClick={(row) => navigate(`${row.original.id}`)}
      />
    </div>
  );
};

export default VocabulariesTable;
