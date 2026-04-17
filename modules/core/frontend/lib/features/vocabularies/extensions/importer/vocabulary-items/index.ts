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

import { useEffect } from "react";
import {
  LoadSetBlockData,
  LoadSetData,
  PendingLoadSetBlock,
  useRegisterImporter,
} from "../../../../importer";
import VocabularyItemLoadSetBlockViewerExtraActions from "./VocabularyItemLoadSetBlockViewerExtraActions";
import {
  EndpointError,
  EndpointSuccess,
  notifyOnError,
  request,
} from "@grit42/api";

interface PendingVocabularyLoadSetBlock extends PendingLoadSetBlock {
  vocabulary_id?: number;
}

interface VocabularyItemLoadSetBlockData extends LoadSetBlockData {
  vocabulary_id?: number;
}

const refineVocabularyLoadSetBlocks = async (
  blocks: PendingVocabularyLoadSetBlock[],
) => {
  const names = blocks.map(({ name }) => name);
  const response = await request<
    EndpointSuccess<Record<string, number>>,
    EndpointError
  >(`/grit/core/vocabularies/vocabulary_ids_from_names`, {
    method: "POST",
    data: {
      names,
    },
  });

  if (!response.success) {
    notifyOnError(response.errors);
    return blocks;
  }

  const vocabularyIdsByName = response.data;

  for (const block of blocks) {
    if (vocabularyIdsByName[block.name]) {
      block.vocabulary_id = vocabularyIdsByName[block.name];
    }
  }

  return blocks;
};

const refineVocabularyItemLoadSetBlockCancelUrlParams = (
  _loadSet: LoadSetData,
  blocks: VocabularyItemLoadSetBlockData[],
): Record<string, string> => {
  if (blocks.length === 0 || !blocks[0].vocabulary_id) return {};
  return { vocabulary_id: blocks[0].vocabulary_id.toString() };
};

const useRegisterVocabularyItemImporter = () => {
  const registerImporter = useRegisterImporter();

  useEffect(() => {
    const unregisterVocabularyItemImporter = registerImporter(
      "Grit::Core::VocabularyItem",
      {
        refineBlocks: refineVocabularyLoadSetBlocks,
        refineCancelUrlParams: refineVocabularyItemLoadSetBlockCancelUrlParams,
        LoadSetBlockViewerExtraActions:
          VocabularyItemLoadSetBlockViewerExtraActions,
      },
    );

    return () => {
      unregisterVocabularyItemImporter();
    };
  }, [registerImporter]);

  return null;
};

export default useRegisterVocabularyItemImporter;
