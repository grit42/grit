import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorPage } from "@grit42/client-library/components";
import { EntityData, useInfiniteEntityData } from "@grit42/core";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { CompoundData } from "../../../../queries/compounds";


interface CompoundCVData extends EntityData {
  id: number;
  entity_id_value: number;
  value: number;
  assay_data_sheet_column_id: number;
  experiment_data_sheet_record_id: number;
  assay_data_sheet_column_id__name: string;
  assay_data_sheet_definition_id: number;
  assay_data_sheet_definition_id__name: string;
  experiment_data_sheet_id: number;
  experiment_id: number;
  experiment_id__name: string;
  assay_id: number;
  assay_id__name: string;
  unit_id: number;
  unit_id__abbreviation: string | null;
}

const CompoundCVResultsTable = ({ compound }: { compound: CompoundData }) => {
  const navigate = useNavigate();

  const tableColumns = useTableColumns<CompoundCVData>([
    {
      name: "assay_id__name",
      display_name: "Assay",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "experiment_id__name",
      display_name: "Experiment",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "assay_data_sheet_definition_id__name",
      display_name: "Data Sheet",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "assay_data_sheet_column_id__name",
      display_name: "Column",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "value",
      display_name: "Value",
      default_hidden: false,
      required: false,
      type: "decimal",
      unique: false,
    },
    {
      name: "unit_id__abbreviation",
      display_name: "Unit",
      default_hidden: false,
      required: false,
      type: "entity",
      unique: false,
      entity: {
        name: "Unit",
        full_name: "Grit::Core::Unit",
        path: "grit/core/unit",
        column: "unit_id",
        primary_key: "id",
        primary_key_type: "integer",
        display_column: "abbreviation",
        display_column_type: "string",
      }
    },
  ]);

  const tableState = useSetupTableState<CompoundCVData>(
    "experiment-data-sheet-records-list",
    tableColumns,
    {
      saveState: true,
      settings: {
        enableColumnDescription: true,
        enableColumnOrderReset: true,
      },
    },
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteEntityData<CompoundCVData>(
      "grit/compounds/compounds",
      tableState.sorting,
      tableState.filters,
      {
        compound_id: compound.id,
        scope: "cv",
      },
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table
      loading={isLoading && !isFetchingNextPage}
      header=""
      data={flatData}
      tableState={tableState}
      onRowClick={(row) =>
        navigate(
          `/assays/experiments/${row.original.experiment_id.toString()}/sheets/${row.original.experiment_data_sheet_id.toString()}`,
        )
      }
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export { CompoundCVResultsTable };
