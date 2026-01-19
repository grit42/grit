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

import { Filter, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import {
  useAssayModelColumns,
  useInfinitePublishedAssayModels,
} from "../../queries/assay_models";
import { useEffect, useMemo, useState } from "react";
import {
  EntityData,
  EntityFormFieldEntity,
  EntitySelector,
} from "@grit42/core";
import { useNavigate } from "react-router-dom";
import { useToolbar } from "@grit42/core/Toolbar";
import CogIcon from "@grit42/client-library/icons/Cog";
import { Button, Input, Surface } from "@grit42/client-library/components";
import { useLocalStorage } from "@grit42/client-library/hooks";
import { useDebounceCallback } from "usehooks-ts";

const getRowId = (data: EntityData) => data.id.toString();

const ASSAY_TYPE_ENTITY: EntityFormFieldEntity = {
  name: "Assay type",
  full_name: "Grit::Assays::AssayType",
  path: `grit/assays/assay_types`,
  primary_key: "id",
  primary_key_type: "integer",
  column: "assay_type_id__name",
  display_column: "name",
  display_column_type: "string",
  multiple: true,
};

interface AssayModelPropertiesFiltersValue {
  assay_type_id?: number[];
  name?: string;
}

const AssayModelPropFilters = ({
  filters,
  setFilters,
}: {
  filters: AssayModelPropertiesFiltersValue;
  setFilters: (
    v:
      | AssayModelPropertiesFiltersValue
      | ((
          prev: AssayModelPropertiesFiltersValue | undefined,
        ) => AssayModelPropertiesFiltersValue),
  ) => void;
}) => {
    const [assayModelName, setAssayModelName] = useState(filters.name ?? "");

  const setAssayTypeFilter = (v: number | number[] | null) =>
    setFilters((prev = {}) => {
      const newState = { ...prev };
      if (Array.isArray(v) && v.length > 0) {
        newState.assay_type_id = v;
      } else if (!Array.isArray(v) && v) {
        newState.assay_type_id = [v];
      } else {
        delete newState.assay_type_id;
      }
      return newState;
    });

  const setNameFilter = useDebounceCallback(
    (v: string) =>
      setFilters((prev = {}) => {
        if (v?.length > 0) {
          return { ...prev, name: v };
        } else {
          const newState = { ...prev };
          delete newState.name;
          return newState;
        }
      }),
    250,
  );

  useEffect(() => {
    if (assayModelName !== filters.name) {
      setNameFilter(assayModelName);
      return setNameFilter.cancel;
    }
  }, [assayModelName, filters.name, setNameFilter]);


  return (
    <Surface
      style={{
        display: "grid",
        gridTemplateColumns: "20vw",
        gap: "calc(var(--spacing) * 2)",
        gridAutoRows: "max-content",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Properties filters</h2>
        {Object.keys(filters).length > 0 && (
          <Button
            color="primary"
            onClick={() => {
              setAssayModelName("");
              setFilters({});
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <EntitySelector
        entity={ASSAY_TYPE_ENTITY}
        onChange={setAssayTypeFilter}
        onBlur={() => void 0}
        label="Assay type"
        value={filters.assay_type_id}
        error=""
        multiple
      />
      <Input
        label="Assay model name"
        placeholder="Assay model name"
        type="string"
        onChange={(e) => setAssayModelName(e.target.value)}
        value={assayModelName}
      />
    </Surface>
  );
};

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayModelsTable = () => {
  const navigate = useNavigate();

  const { data: columns } = useAssayModelColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const tableColumns = useTableColumns(columns);

  const [propFilters, setPropFilters] = useLocalStorage(
    "assay-model-prop-filters",
    {} as AssayModelPropertiesFiltersValue,
  );

  const tableState = useSetupTableState("assay-models-list", tableColumns, {
    settings: {
      disableVisibilitySettings: true,
      disableColumnReorder: true,
    },
  });

  const filters = useMemo(
    (): Filter[] => [
      ...tableState.filters,
      {
        active: !!propFilters.assay_type_id?.length,
        column: "assay_type_id",
        id: "assay_type_id",
        operator: "in_list",
        property: "assay_type_id",
        property_type: "integer",
        type: "integer",
        value: propFilters.assay_type_id,
      },
      {
        active: !!propFilters.name?.length,
        column: "name",
        id: "name",
        operator: "contains",
        property: "name",
        property_type: "string",
        type: "name",
        value: propFilters.name,
      },
    ],
    [tableState.filters, propFilters.assay_type_id, propFilters.name],
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfinitePublishedAssayModels(tableState.sorting, filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const registerToolbarActions = useToolbar();

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "ASSAY_MODEL_SETTINGS",
          icon: <CogIcon />,
          label: "Manage assay models",
          requiredRoles: ["Administrator", "AssayAdministrator"],
          onClick: () => navigate("/assays/assay-models/settings/assay-models"),
        },
      ],
    });
  }, [navigate, registerToolbarActions]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "min-content 1fr",
        gridTemplateRows: "1fr",
        overflow: "auto",
        height: "100%",
        gap: "var(--spacing)",
      }}
    >
      <AssayModelPropFilters
        filters={propFilters}
        setFilters={setPropFilters}
      />
      <Table
        disableFooter
        header="Assay models"
        getRowId={getRowId}
        onRowClick={(row) => navigate(row.id)}
        tableState={tableState}
        data={flatData}
        loading={isLoading}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0].total,
        }}
        noDataMessage={
          isError
            ? error
            : filters.some(({active}) => active)
            ? "All models are filtered"
            : "No published assay models"
        }
      />
    </div>
  );
};

export default AssayModelsTable;
