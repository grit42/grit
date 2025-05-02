import { Registrant as CoreRegistrant } from "@grit/core";
import { Registrant as CompoundsRegistrant } from "@grit/compounds";

const Registrant = () => (
  <>
    <CoreRegistrant />
    <CompoundsRegistrant />
  </>
);

export default Registrant;
