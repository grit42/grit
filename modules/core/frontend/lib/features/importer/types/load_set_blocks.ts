import { EntityData, EntityInfo } from "../../entities";

export const LoadSetBlockEntityInfo: EntityInfo = {
  full_name: "Grit::Core::LoadSetBlock",
  name: "Load set block",
  plural: "Load set blocks",
  path: "grit/core/load_set_blocks",
};

export interface LoadSetBlockMapping {
  header: string | null;
  find_by: string | null;
  constant: boolean;
  value: string | number | boolean | null;
}

export type LoadSetBlockMappings = Record<string, LoadSetBlockMapping>;

export interface LoadSetBlockData extends EntityData {
  load_set_id: number;
  name: string;
  separator: string;
  headers: { name: string; display_name: string | null }[];
  status_id: number;
  status_id__name: string;
  mappings?: LoadSetBlockMappings;
  error: string | null;
  has_errors: boolean;
  has_warnings: boolean;
}

export type LoadSetBlockPreviewData = Record<string, string>;

export interface LoadSetBlockErroredData {
  line: number;
  datum: any;
  record_errors: Record<string, string[]>;
}

export interface LoadSetBlockWarningData {
  line: number;
  datum: any;
  record_warnings: Record<string, string[]>;
}
