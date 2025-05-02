import { Registrant as CoreRegistrant } from "@grit/core";
import { Registrant as CompoundsRegistrant } from "@grit/compounds";
import { Registrant as AssaysRegistrant } from "@grit/assays";

const Registrant = () => (
  <>
    <CoreRegistrant />
    <CompoundsRegistrant />
    <AssaysRegistrant />
  </>
);

export default Registrant;
