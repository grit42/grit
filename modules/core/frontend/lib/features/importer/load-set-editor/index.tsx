import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useLoadSet, useLoadSetEntity } from "../api/queries/load_sets";
import { useLoadSetBlocks } from "../api/queries/load_set_blocks";
import { Navigate, Route, Routes } from "react-router-dom";
import { LOAD_SET_STATUS } from "../constants/load_set_statuses";
import LoadSetEditorBlock from "./LoadSetEditorBlock";
import LoadSetEditorLayout from "./LoadSetEditorLayout";

const LoadSetEditor = ({ loadSetId }: { loadSetId: number | string }) => {
  const { data, isLoading, isError, error } = useLoadSet(loadSetId);
  const {
    data: entityInfo,
    isLoading: isEntityInfoLoading,
    isError: isEntityInfoError,
    error: entityInfoError,
  } = useLoadSetEntity(data?.entity ?? "", {
    enabled: !!data,
  });

  const {
    data: blocks,
    isLoading: isBlocksLoading,
    isError: isBlocksError,
    error: blocksError,
  } = useLoadSetBlocks(loadSetId, undefined, undefined, undefined, {
    refetchInterval: (query) => {
      return query.state.data?.some(({ status_id__name }) => {
        const s = status_id__name;
        return (
          s === LOAD_SET_STATUS.INITIALIZING ||
          s === LOAD_SET_STATUS.VALIDATING ||
          s === LOAD_SET_STATUS.CONFIRMING
        );
      })
        ? 2000
        : false;
    },
  });

  if (isLoading || isBlocksLoading || isEntityInfoLoading) {
    return <Spinner />;
  }

  if (
    isError ||
    !data ||
    isBlocksError ||
    !blocks ||
    isEntityInfoError ||
    !entityInfo
  ) {
    return <ErrorPage error={error ?? blocksError ?? entityInfoError} />;
  }

  return (
    <>
      <style>{`main#app-shell { padding: 0; } `}</style>
      <Routes>
        <Route
          path="*"
          element={
            <LoadSetEditorLayout
              loadSet={data}
              loadSetBlocks={blocks}
              entityInfo={entityInfo}
            />
          }
        >
          <Route path="empty" element={<ErrorPage />} />
          <Route
            path=":load_set_block_id"
            element={
              <LoadSetEditorBlock loadSet={data} loadSetBlocks={blocks} />
            }
          />
          <Route
            index
            element={<Navigate to={blocks[0]?.id.toString() ?? "empty"} />}
          />
        </Route>
      </Routes>
    </>
  );
};

export default LoadSetEditor;
