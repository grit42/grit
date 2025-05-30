import { Button } from "@grit42/client-library/components";
import { LoadSetViewerExtraActionsProps } from "@grit42/core";
import { Link } from "react-router-dom";

const ExperimentDataSheetRecordLoadSetViewerExtraActions = ({loadSet}: LoadSetViewerExtraActionsProps) => {
  return (
    <Link
      to={`/assays/experiments/${loadSet.experiment_id}/sheets/${loadSet.experiment_data_sheet_id}`}
    >
      <Button color="secondary">Go to experiment</Button>
    </Link>
  );
};

export default ExperimentDataSheetRecordLoadSetViewerExtraActions;
