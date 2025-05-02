import { Registrant as CoreRegistrant } from "@grit/core";
import { Registrant as CompoundsRegistrant } from "@grit/assays";

const Registrant = () => (
  <>
    <CoreRegistrant />
    <CompoundsRegistrant />
  </>
);

export default Registrant;
