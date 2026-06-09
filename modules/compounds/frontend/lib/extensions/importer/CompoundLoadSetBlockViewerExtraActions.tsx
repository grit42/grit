import { Button } from "@grit42/client-library/components";
import { Link } from "react-router-dom";

const CompoundLoadSetBlockViewerExtraActions = () => {
  return (
    <Link to={`/compounds`}>
      <Button color="secondary">Go to compounds</Button>
    </Link>
  );
};

export default CompoundLoadSetBlockViewerExtraActions;
