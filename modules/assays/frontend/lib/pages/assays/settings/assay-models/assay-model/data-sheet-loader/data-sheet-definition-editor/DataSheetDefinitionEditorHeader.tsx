import {
  Button,
  ButtonGroup,
  useConfirm,
} from "@grit42/client-library/components";
import styles from "./dataSheetDefinitionEditor.module.scss";
import { useNavigate } from "react-router-dom";

const DataSheetDefinitionEditorHeader = ({
  isSubmitting,
  canSubmit,
  isDirty,
}: {
  isSubmitting: boolean;
  isDirty: boolean;
  canSubmit: boolean;
}) => {
  const confirm = useConfirm();
  const navigate = useNavigate();
  return (
    <div className={styles.dataSheetsFormHeader}>
      <h3 className={styles.header}>
        Data sheet definitions import: verify column definitions
      </h3>
      <ButtonGroup>
        <Button
          onClick={async () => {
            if (
              !isDirty ||
              (await confirm({ body: "You have unsaved changes. Continue?" }))
            ) {
              navigate("../../map");
            }
          }}
        >
          Back to mapping
        </Button>
        <Button
          color="secondary"
          disabled={!canSubmit}
          type="submit"
          loading={isSubmitting}
        >
          Save sheets
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default DataSheetDefinitionEditorHeader;
