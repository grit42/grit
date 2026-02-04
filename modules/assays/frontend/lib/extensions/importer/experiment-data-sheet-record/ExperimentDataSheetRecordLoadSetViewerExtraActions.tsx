import { Button } from "@grit42/client-library/components";
import { LoadSetViewerExtraActionsProps } from "@grit42/core";
import { Link } from "react-router-dom";

const ExperimentDataSheetRecordLoadSetViewerExtraActions = ({loadSet}: LoadSetViewerExtraActionsProps) => {
  return (
    <Link
      to={`/assays/experiments/${loadSet.load_set_blocks[0].experiment_id}/sheets/${loadSet.load_set_blocks[0].assay_data_sheet_definition_id}`}
    >
      <Button color="secondary">Go to experiment</Button>
    </Link>
  );
};

export default ExperimentDataSheetRecordLoadSetViewerExtraActions;
