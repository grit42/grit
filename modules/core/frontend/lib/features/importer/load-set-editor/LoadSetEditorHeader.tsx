import { Button, ButtonGroup } from "@grit42/client-library/components";
import { LoadSetBlockData } from "../types/load_set_blocks";
import { LoadSetData } from "../types/load_sets";
import { useLoadSetEditorActions } from "./load-set-block-editor/useLoadSetBlockEditorActions";
import styles from "./loadSetEditor.module.scss";
import { EntityInfo } from "../../entities";

const LoadSetEditorHeader = ({
  loadSet,
  entityInfo,
  loadSetBlocks,
}: {
  loadSet: LoadSetData;
  loadSetBlocks: LoadSetBlockData[];
  entityInfo: EntityInfo;
}) => {
  const { handleCancel, isPending } = useLoadSetEditorActions(
    loadSet,
    loadSetBlocks,
  );

  return (
    <div className={styles.header}>
      <div>
        <h3>Importing {entityInfo.plural}</h3>
        <em>{loadSet.name}</em>
      </div>
      <ButtonGroup>
        <Button
          onClick={handleCancel}
          disabled={isPending.cancel}
          loading={isPending.cancel}
          color="danger"
        >
          Cancel import
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default LoadSetEditorHeader;
