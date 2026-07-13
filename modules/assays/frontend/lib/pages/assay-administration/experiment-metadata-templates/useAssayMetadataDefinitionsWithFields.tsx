/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { EntityFormFieldDef } from "@grit42/core";
import { useAssayMetadataDefinitions } from "../../../queries/assay_metadata_definitions";

export const useAssayMetadataDefinitionsWithFields = () => {
  const metadataDefinitions = useAssayMetadataDefinitions();

  return useMemo(
    () => ({
      ...metadataDefinitions,
      fields: [
        ...(metadataDefinitions.data ?? [])
          .map(
            (md): EntityFormFieldDef => ({
              name: md.safe_name,
              display_name: md.name,
              type: "entity",
              required: false,
              default: null,
              entity: {
                name: md.name,
                full_name: "Grit::Core::VocabularyItem",
                path: `grit/core/vocabularies/${md.vocabulary_id}/vocabulary_items`,
                primary_key: "id",
                primary_key_type: "integer",
                column: md.name,
                display_column: "name",
                display_column_type: "string",
              },
              disabled: false,
            }),
          )
          .sort((a, b) => {
            if (a.required && !b.required) return -1;
            if (!a.required && b.required) return 1;
            return a.name.localeCompare(b.name);
          }),
      ],
    }),
    [metadataDefinitions],
  );
};
