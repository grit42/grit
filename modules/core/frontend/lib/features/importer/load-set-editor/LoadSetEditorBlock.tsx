import { ErrorPage } from "@grit42/client-library/components";
import { useParams } from "react-router-dom";
import { LOAD_SET_STATUS } from "../constants/load_set_statuses";
import LoadSetBlockEditor from "./load-set-block-editor";
import LoadSetBlockInitializer from "./load-set-block-initializer";
import LoadSetBlockViewer from "./load-set-block-viewer";
import LoadSetBlockError from "./load-set-block-error";
import { LoadSetData } from "../types/load_sets";
import { LoadSetBlockData } from "../types/load_set_blocks";

const LoadSetEditorBlock = ({
  loadSet,
  loadSetBlocks,
}: {
  loadSet: LoadSetData;
  loadSetBlocks: LoadSetBlockData[];
}) => {
  const { load_set_block_id } = useParams() as {
    load_set_block_id: string;
  };

  const loadSetBlock = loadSetBlocks.find(
    ({ id }) => id.toString() === load_set_block_id,
  );

  if (!loadSetBlock) {
    return (
      <ErrorPage
        error={`Load set block with id ${load_set_block_id} not found`}
      />
    );
  }

  const status = loadSetBlock.status_id__name;

  if (
    status === LOAD_SET_STATUS.CREATED ||
    status === LOAD_SET_STATUS.INITIALIZING
  ) {
    return <LoadSetBlockInitializer />;
  }

  if (status === LOAD_SET_STATUS.ERRORED) {
    return (
      <LoadSetBlockError key={loadSetBlock.id} loadSetBlock={loadSetBlock} />
    );
  }

  if (status === LOAD_SET_STATUS.SUCCEEDED) {
    return (
      <LoadSetBlockViewer
        key={loadSetBlock.id}
        loadSet={loadSet}
        loadSetBlock={loadSetBlock}
      />
    );
  }

  return (
    <LoadSetBlockEditor
      key={loadSetBlock.id}
      loadSet={loadSet}
      loadSetBlock={loadSetBlock}
    />
  );
};

export default LoadSetEditorBlock;
