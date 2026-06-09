import { Button } from "@grit42/client-library/components";
import { LoadSetBlockViewerExtraActionsProps } from "@grit42/core";
import { Link } from "react-router-dom";

const ExperimentDataSheetRecordLoadSetViewerExtraActions = ({
  loadSetBlock,
}: LoadSetBlockViewerExtraActionsProps) => {
  return (
    <Link
      to={`/assays/experiments/${loadSetBlock.experiment_id}/sheets/${loadSetBlock.assay_data_sheet_definition_id}`}
    >
      <Button color="secondary">Go to experiment</Button>
    </Link>
  );
};

export default ExperimentDataSheetRecordLoadSetViewerExtraActions;
