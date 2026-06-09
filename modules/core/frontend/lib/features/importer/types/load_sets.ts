import { EntityData, EntityInfo } from "../../entities";
import { LoadSetBlockData } from "./load_set_blocks";

export const LoadSetEntityInfo: EntityInfo = {
  full_name: "Grit::Core::LoadSet",
  name: "Load set",
  plural: "Load sets",
  path: "grit/core/load_sets",
};

export interface LoadSetData extends EntityData {
  entity: string;
  name: string;
  origin_id: number;
  origin_id__name: string;
  load_set_blocks: LoadSetBlockData[];
  status_id: number;
  status_id__name: string;
}
