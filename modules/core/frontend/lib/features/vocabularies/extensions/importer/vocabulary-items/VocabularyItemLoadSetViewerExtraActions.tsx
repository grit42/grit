import { Button } from "@grit42/client-library/components";
import { LoadSetViewerExtraActionsProps } from "../../../../importer";
import { Link } from "react-router-dom";

const VocabularyItemLoadSetViewerExtraActions = ({loadSet}: LoadSetViewerExtraActionsProps) => {
  return (
    <Link
      to={`/core/vocabularies/${loadSet.vocabulary_id}`}
    >
      <Button color="secondary">Go to vocabulary</Button>
    </Link>
  );
};

export default VocabularyItemLoadSetViewerExtraActions;
