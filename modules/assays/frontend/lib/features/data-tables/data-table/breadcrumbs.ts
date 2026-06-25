import { DATA_TABLES_BREADCRUMBS } from "../data-tables/breadcrumbs";
import { DataTableData } from "../queries/data_tables";

export const DATA_TABLE_BREADCRUMBS = (dataTable: DataTableData) => [
  ...DATA_TABLES_BREADCRUMBS,
  {
    label: dataTable.name,
    url: `/assays/data_tables/${dataTable.id}/data`,
  },
];
