/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { Table } from "@grit/table";
import { useCallback, useEffect } from "react";
import { useToolbar } from "@grit/core/Toolbar";
import Circle1NewIcon from "@grit/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@grit/client-library/components";
import { useTableColumns } from "@grit/core/utils";
import {
  useVocabularies,
  useVocabularyColumns,
} from "../../../../../queries/vocabularies";
import styles from "./vocabularies.module.scss";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const VocabulariesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: vocabularies } = useVocabularies();
  const { data: vocabularyColumns } = useVocabularyColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const vocabulariesTableColumns = useTableColumns(vocabularyColumns);

  const navigateToNew = useCallback(
    () => navigate("new"),
    [navigate, pathname],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New vocabulary",
          onClick: navigateToNew,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname]);

  return (
    <div className={styles.vocabularies}>
      <Table
        header="Vocabularies"
        settings={{
          disableColumnReorder: true,
          disableVisibilitySettings: true,
        }}
        headerActions={<Button onClick={navigateToNew}>New</Button>}
        className={styles.typesTable}
        data={vocabularies}
        columns={vocabulariesTableColumns}
        onRowClick={(row) => navigate(`${row.original.id}`)}
      />
    </div>
  );
};

export default VocabulariesTable;
