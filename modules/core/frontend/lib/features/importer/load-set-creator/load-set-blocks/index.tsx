import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useLoadSetBlockFields } from "../../api/queries/load_set_blocks";
import { useLoadSetFields } from "../../api/queries/load_sets";
import { useLoadSetCreatorContext } from "../LoadSetCreatorContext";
import LoadSetBlocksForm from "./LoadSetBlocksForm";

const LoadSetBlocks = () => {
  const { entityInfo } = useLoadSetCreatorContext();

  const {
    data: loadSetFields,
    isLoading: isLoadSetFieldsLoading,
    isError: isLoadSetFieldsError,
    error: loadSetFieldsError,
  } = useLoadSetFields();
  const {
    data: loadSetBlockFields,
    isLoading: isLoadSetBlockFieldsLoading,
    isError: isLoadSetBlockFieldsError,
    error: loadSetBlockFieldsError,
  } = useLoadSetBlockFields(entityInfo.full_name);

  if (isLoadSetFieldsLoading || isLoadSetBlockFieldsLoading) {
    return <Spinner />;
  }

  if (
    isLoadSetFieldsError ||
    isLoadSetBlockFieldsError ||
    !loadSetFields ||
    !loadSetBlockFields
  ) {
    return <ErrorPage error={loadSetFieldsError ?? loadSetBlockFieldsError} />;
  }

  return (
    <LoadSetBlocksForm
      loadSetFields={loadSetFields}
      loadSetBlockFields={loadSetBlockFields}
    />
  );
};

export default LoadSetBlocks;
