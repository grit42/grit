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
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@grit42/api";
import {
  useValidateLoadSetBlockMutation,
  useConfirmLoadSetBlockMutation,
  useRollbackLoadSetBlockMutation,
} from "../mutations";
import { useDestroyEntityMutation } from "../../entities";
import { LoadSetData, LoadSetMapping } from "../types";
import { invalidateLoadSet, invalidateErroredData } from "../invalidation";
import { isBlockValidated } from "../constants";
import { buildCancelUrl, shouldRollbackBeforeCancel } from "../utils/actions";

interface UseLoadSetEditorActionsOptions {
  loadSet: LoadSetData;
  onMappingsChange: (mappings: Record<string, LoadSetMapping>) => void;
}

/**
 * Hook that encapsulates all mutation and action logic for the LoadSetEditor.
 * Returns handlers for validate, confirm, rollback, and cancel operations,
 * along with pending state flags.
 */
export function useLoadSetEditorActions({
  loadSet,
  onMappingsChange,
}: UseLoadSetEditorActionsOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const blockId = loadSet.load_set_blocks[0].id;

  const validateMutation = useValidateLoadSetBlockMutation(blockId);
  const confirmMutation = useConfirmLoadSetBlockMutation(blockId);
  const rollbackMutation = useRollbackLoadSetBlockMutation(blockId);
  const destroyMutation = useDestroyEntityMutation("grit/core/load_sets");

  const isValidated = isBlockValidated(loadSet);

  const handleValidate = useCallback(
    async (mappings: Record<string, LoadSetMapping>) => {
      try {
        await validateMutation.mutateAsync(mappings);
      } finally {
        onMappingsChange(mappings);
        await Promise.all([
          invalidateLoadSet(queryClient, loadSet.id),
          invalidateErroredData(queryClient, blockId),
        ]);
      }
    },
    [validateMutation, onMappingsChange, queryClient, loadSet.id, blockId],
  );

  const handleConfirm = useCallback(async () => {
    await confirmMutation.mutateAsync();
    await invalidateLoadSet(queryClient, loadSet.id);
  }, [confirmMutation, queryClient, loadSet.id]);

  const handleRollback = useCallback(async () => {
    await rollbackMutation.mutateAsync();
    await invalidateLoadSet(queryClient, loadSet.id);
  }, [rollbackMutation, queryClient, loadSet.id]);

  const handleCancel = useCallback(async () => {
    if (shouldRollbackBeforeCancel(loadSet)) {
      await rollbackMutation.mutateAsync();
    }
    await destroyMutation.mutateAsync(loadSet.id);
    navigate(buildCancelUrl(loadSet));
  }, [loadSet, rollbackMutation, destroyMutation, navigate]);

  const handleSubmit = useCallback(
    async (mappings: Record<string, LoadSetMapping>) => {
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
    handleRollback,
    handleCancel,
    handleSubmit,
    isValidated,
    isPending: {
      validate: validateMutation.isPending,
      confirm: confirmMutation.isPending,
      rollback: rollbackMutation.isPending,
      destroy: destroyMutation.isPending,
    },
  };
}
