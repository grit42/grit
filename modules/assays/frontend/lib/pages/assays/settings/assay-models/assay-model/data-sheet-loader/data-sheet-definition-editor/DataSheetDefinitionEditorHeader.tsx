import { Button, ButtonGroup } from "@grit42/client-library/components";
import styles from "../dataSheetStructureLoader.module.scss";
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
  const navigate = useNavigate();
  return (
    <div className={styles.dataSheetsFormHeader}>
      <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Data sheet definitions import: verify column definitions
      </h3>
      <ButtonGroup>
        <Button
          onClick={() => {
            if (
              !isDirty ||
              window.confirm("You have unsaved changes. Continue?")
            ) {
              navigate("../map");
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
