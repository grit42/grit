import { ErrorPage, LoadingPage } from "@grit42/client-library/components";
import { useSearchParams } from "react-router-dom";
import LoadSetCreatorContextProvider from "./LoadSetCreatorContext";
import { useLoadSetEntity, useLoadSetFields } from "../api/queries/load_sets";
import { useLoadSetBlockFields } from "../api/queries/load_set_blocks";
import LoadSetCreatorStep from "./LoadSetCreatorStep";

const LoadSetCreator = ({ entity }: { entity: string }) => {
  const [searchParams] = useSearchParams();
  const presets = Object.fromEntries(searchParams.entries());
  const {
    data: entityInfo,
    isLoading,
    isError,
    error,
  } = useLoadSetEntity(entity);

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
  } = useLoadSetBlockFields(entity);

  if (isLoading || isLoadSetFieldsLoading || isLoadSetBlockFieldsLoading) {
    return <LoadingPage />;
  }

  if (
    isError ||
    !entityInfo ||
    isLoadSetFieldsError ||
    isLoadSetBlockFieldsError ||
    !loadSetFields ||
    !loadSetBlockFields
  ) {
    return (
      <ErrorPage
        error={loadSetFieldsError ?? loadSetBlockFieldsError ?? error}
      />
    );
  }

  return (
    <LoadSetCreatorContextProvider
      presets={presets}
      entityInfo={entityInfo}
      loadSetFields={loadSetFields}
      loadSetBlockFields={loadSetBlockFields}
    >
      <LoadSetCreatorStep />
    </LoadSetCreatorContextProvider>
  );
};

export default LoadSetCreator;
