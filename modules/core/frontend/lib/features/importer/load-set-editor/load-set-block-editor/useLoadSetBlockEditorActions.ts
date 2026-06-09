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

import { useCallback } from "react";
import {
  useConfirmLoadSetBlockMutation,
  useUndoLoadSetBlockValidationMutation,
  useValidateLoadSetBlockMutation,
} from "../../api/mutations/load_set_blocks";
import {
  LoadSetBlockData,
  LoadSetBlockMappings,
} from "../../types/load_set_blocks";
import { LoadSetData } from "../../types/load_sets";
import { useNavigate } from "react-router-dom";
import { getURLParams, URLParams } from "@grit42/api";
import { useCancelLoadSetMutation } from "../../api/mutations/load_sets";
import { useImporter } from "../../importer-context/ImportersContext";
import { LOAD_SET_STATUS } from "../../constants/load_set_statuses";

interface UseLoadSetEditorActionsOptions {
  loadSet: LoadSetData;
  loadSetBlock: LoadSetBlockData;
  onMappingsChange: (mappings: LoadSetBlockMappings) => void;
}

export const getSearchForCancel = (propertyBag: any) => {
  const data: URLParams = {};
  for (const key in propertyBag) {
    if (
      !key.endsWith("__name") &&
      ![
        "id",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
        "status_id",
        "load_set_id",
        "name",
        "separator",
        "has_warnings",
        "has_errors",
      ].includes(key) &&
      !["function", "object", "symbol"].includes(typeof propertyBag[key])
    ) {
      data[key] = propertyBag[key] as URLParams[string];
    }
  }
  return data;
};

const buildCancelUrl = (propertyBag: any): string =>
  `/core/load_sets/new?${getURLParams(getSearchForCancel(propertyBag))}`;

export function useLoadSetEditorActions(
  loadSet: LoadSetData,
  loadSetBlocks: LoadSetBlockData[],
) {
  const { refineCancelUrlParams } = useImporter(loadSet.entity);
  const navigate = useNavigate();
  const cancelMutation = useCancelLoadSetMutation(loadSet.id);

  const handleCancel = useCallback(async () => {
    await cancelMutation.mutateAsync();
    navigate(
      buildCancelUrl(
        refineCancelUrlParams
          ? { ...loadSet, ...refineCancelUrlParams(loadSet, loadSetBlocks) }
          : { ...loadSet },
      ),
    );
  }, [cancelMutation, loadSet, loadSetBlocks, navigate, refineCancelUrlParams]);

  return {
    handleCancel,
    isPending: {
      cancel: cancelMutation.isPending,
    },
  };
}

export function useLoadSetBlockEditorActions({
  loadSetBlock,
  onMappingsChange,
}: UseLoadSetEditorActionsOptions) {
  const blockId = loadSetBlock.id;

  const validateMutation = useValidateLoadSetBlockMutation(blockId);
  const confirmMutation = useConfirmLoadSetBlockMutation(blockId);
  const undoValidation = useUndoLoadSetBlockValidationMutation(blockId);

  const isValidated =
    loadSetBlock.status_id__name === LOAD_SET_STATUS.VALIDATED ||
    loadSetBlock.status_id__name === LOAD_SET_STATUS.CONFIRMING;

  const handleValidate = useCallback(
    async (mappings: LoadSetBlockMappings) => {
      try {
        await validateMutation.mutateAsync(mappings);
      } finally {
        onMappingsChange(mappings);
      }
    },
    [validateMutation, onMappingsChange],
  );

  const handleConfirm = useCallback(async () => {
    await confirmMutation.mutateAsync();
  }, [confirmMutation]);

  const handleUndoValidation = useCallback(async () => {
    await undoValidation.mutateAsync();
  }, [undoValidation]);

  const handleSubmit = useCallback(
    async (mappings: LoadSetBlockMappings) => {
      if (isValidated) {
        return handleConfirm();
      }
      return handleValidate(mappings);
    },
    [isValidated, handleConfirm, handleValidate],
  );

  return {
    handleValidate,
    handleConfirm,
    handleUndoValidation,
    handleSubmit,
    isValidated,
    isPending: {
      validate: validateMutation.isPending,
      confirm: confirmMutation.isPending,
      undoValidation: undoValidation.isPending,
    },
  };
}
