import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Table } from "@grit42/table";
import { useQuery } from "@grit42/api";
import { AnyFormApi, useStore } from "@grit42/form";
import {
  PendingLoadSetBlock,
  PendingLoadSetBlockPreview,
  useLoadSetCreatorContext,
} from "../LoadSetCreatorContext";
import { useImporter } from "../../importer-context/ImportersContext";

export const useBlockSampleData = (
  block: PendingLoadSetBlock,
  sampleData: (
    block: PendingLoadSetBlock,
  ) => Promise<PendingLoadSetBlockPreview>,
) => {
  return useQuery({
    queryKey: ["blockSampleData", block.id, block.separator, block.format],
    queryFn: (): Promise<PendingLoadSetBlockPreview> => sampleData(block),
  });
};

const BlockPreview = ({
  blockIndex,
  form,
}: {
  blockIndex: number;
  form: AnyFormApi;
}) => {
  const { entityInfo } = useLoadSetCreatorContext();
  const { sampleData } = useImporter(entityInfo.full_name);
  const block = useStore(
    form.baseStore,
    (state) => state.values.blocks[blockIndex],
  );
  const { data, isLoading, isError, error } = useBlockSampleData(
    block,
    sampleData,
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data || !data.sampleData || !data.sampleDataColumns) {
    return <ErrorPage error={error?.message} />;
  }

  return (
    <Table
      columns={data.sampleDataColumns}
      data={data.sampleData}
      settings={{
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableFilters: true,
        disableVisibilitySettings: true,
      }}
    />
  );
};

export default BlockPreview;
