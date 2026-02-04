/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

export {
  useImportersContext,
  useImporter,
  useRegisterImporter,
} from "./ImportersContext";

export type {
  ImporterDef,
  LoadSetCreatorProps,
  LoadSetEditorProps,
  LoadSetViewerProps,
  LoadSetViewerExtraActionsProps,
} from "./ImportersContext";

export { default as ImportersProvider } from "./ImportersProvider";

export {
  useCreateLoadSetMutation,
  useSetLoadSetMappingsMutation,
  useRollbackLoadSetMutation,
  useConfirmLoadSetBlockMutation,
  useValidateLoadSetBlockMutation,
  useSetLoadSetDataMutation,
} from "./mutations";

export {
  useLoadSetFields,
  useLoadSetData,
} from "./queries";

export type {
  LoadSetData,
  LoadSetError,
  LoadSetMapping,
  LoadSetPreviewData,
  NewLoadSetData,
  LoadSetBlockDataUpdateData,
} from "./types";

export * from "./load_set_creator";
export * from "./load_set_editor";
export * from "./load_set_viewer";
export * from "./utils";
