import {
  Button,
  ButtonGroup,
} from "@grit42/client-library/components";
import styles from "../dataSheetStructureLoader.module.scss";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "./formContexts";


function DataSheetDefinitionEditorHeader() {
  const form = useFormContext();
  const navigate = useNavigate();

  return (
    <div className={styles.dataSheetsFormHeader}>
      <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Data sheet definitions import: verify column definitions
      </h3>
      <ButtonGroup>
        <Button onClick={() => navigate("../map")}>Back to mapping</Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div>
              <Button
                color="secondary"
                disabled={!canSubmit}
                type="submit"
                loading={isSubmitting}
                onClick={() => form.handleSubmit()}
              >
                Save sheets
              </Button>
            </div>
          )}
        />
      </ButtonGroup>
    </div>
  );
}

export default DataSheetDefinitionEditorHeader;
