import { EntityData } from "@grit/core";
import { useTableColumns } from "@grit/core/utils";
import { useSetupTableState, Table } from "@grit/table";
import { useNavigate } from "react-router-dom";
import { useAssayExperiments } from "../../../queries/assays";
import { useExperimentColumns } from "../../../queries/experiments";
import styles from "../assays.module.scss";

const getRowId = (data: EntityData) => data.id.toString();

const AssayExperiments = ({ assayId }: { assayId: string | number }) => {
  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns(undefined, {
    select: (columns) => columns.filter((c) => c.name !== "assay_id__name"),
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(
    `assay-${assayId}-experiments-list`,
    tableColumns,
  );
  const { data, isLoading, isError, error } = useAssayExperiments(
    assayId,
    tableState.sorting,
    tableState.filters,
  );

  return (
    <Table
      className={styles.experiments}
      header="Experiments"
      getRowId={getRowId}
      onRowClick={({ id }) => navigate(`/assays/experiments/${id}/details`)}
      tableState={tableState}
      data={data}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
    />
  );
};

export default AssayExperiments;
