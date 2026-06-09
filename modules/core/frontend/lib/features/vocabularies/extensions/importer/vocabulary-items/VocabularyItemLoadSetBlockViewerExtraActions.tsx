import { Button } from "@grit42/client-library/components";
import { Link } from "react-router-dom";
import { LoadSetBlockViewerExtraActionsProps } from "../../../../importer";

const VocabularyItemLoadSetBlockViewerExtraActions = ({
  loadSetBlock,
}: LoadSetBlockViewerExtraActionsProps) => {
  return (
    <Link to={`/core/vocabularies/${loadSetBlock.vocabulary_id}`}>
      <Button color="secondary">Go to vocabulary</Button>
    </Link>
  );
};

export default VocabularyItemLoadSetBlockViewerExtraActions;
