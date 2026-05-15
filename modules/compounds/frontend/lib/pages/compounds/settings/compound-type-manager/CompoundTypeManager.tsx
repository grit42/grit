/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { Table } from "@grit42/table";
import { useBatchProperties } from "../../../../queries/batches";
import {
  useCompoundProperties,
  useCompoundTypes,
} from "../../../../queries/compounds";
import styles from "./compoundTypeManager.module.scss";
import { useEntityColumns, useToolbar } from "@grit42/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";

const CompoundTypeManager = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);

  const { data: types } = useCompoundTypes();
  const { data: typeColumns } = useEntityColumns(
    "Grit::Compounds::CompoundType",
  );
  const { data: compoundProperties } = useCompoundProperties();
  const { data: compoundPropertyColumns } = useEntityColumns(
    "Grit::Compounds::CompoundProperty",
  );
  const { data: batchProperties } = useBatchProperties();
  const { data: batchPropertyColumns } = useEntityColumns(
    "Grit::Compounds::BatchProperty",
  );

  const typesTableColumns = useTableColumns(typeColumns);

  const compoundPropertiesTableColumns = useTableColumns(
    compoundPropertyColumns,
  );

  const batchPropertiesTableColumns = useTableColumns(batchPropertyColumns);

  const { emphasizedCompoundProperties, emphasizedBatchProperties } =
    useMemo(() => {
      if (!selectedTypes.length) return {};
      return {
        emphasizedCompoundProperties: compoundProperties?.reduce(
          (acc, p, index) => ({
            ...acc,
            [index]: selectedTypes.includes(p.compound_type_id),
          }),
          {},
        ),
        emphasizedBatchProperties: batchProperties?.reduce(
          (acc, p, index) => ({
            ...acc,
            [index]: selectedTypes.includes(p.compound_type_id),
          }),
          {},
        ),
      };
    }, [compoundProperties, batchProperties, selectedTypes]);

  const navigateToNew = useCallback(
    (type: string) => () => navigate(`${type}/new`),
    [navigate],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New...",
          items: [
            {
              id: "TYPE",
              text: "Compound type",
              onClick: navigateToNew("compound_types"),
            },
            {
              id: "COMPOUND_PROPERTY",
              text: "Compound property",
              onClick: navigateToNew("compound_properties"),
            },
            {
              id: "BATCH_PROPERTY",
              text: "Batch property",
              onClick: navigateToNew("batch_properties"),
            },
          ],
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew]);

  return (
    <div className={styles.compoundTypeManagerGrid}>
      <Table
        header="Compound types"
        settings={{
          enableSelection: true,
          disableVisibilitySettings: true,
        }}
        headerActions={
          <Button onClick={navigateToNew("compound_types")}>New</Button>
        }
        onSelect={(rows) =>
          setSelectedTypes(
            types?.filter((_, i) => rows[i]).map(({ id }) => id) ?? [],
          )
        }
        className={styles.typesTable}
        data={types}
        columns={typesTableColumns}
        onRowClick={(row) => navigate(`compound_types/${row.original.id}`)}
      />
      <Table
        header="Compound properties"
        settings={{
          disableVisibilitySettings: true,
        }}
        headerActions={
          <Button onClick={navigateToNew("compound_properties")}>New</Button>
        }
        className={styles.compoundPropertiesTable}
        data={compoundProperties}
        columns={compoundPropertiesTableColumns}
        emphasizedRows={emphasizedCompoundProperties}
        onRowClick={(row) => navigate(`compound_properties/${row.original.id}`)}
      />
      <Table
        header="Batch properties"
        settings={{
          disableVisibilitySettings: true,
        }}
        headerActions={
          <Button onClick={navigateToNew("batch_properties")}>New</Button>
        }
        className={styles.batchPropertiesTable}
        data={batchProperties}
        columns={batchPropertiesTableColumns}
        emphasizedRows={emphasizedBatchProperties}
        onRowClick={(row) => navigate(`batch_properties/${row.original.id}`)}
      />
    </div>
  );
};

export default CompoundTypeManager;
