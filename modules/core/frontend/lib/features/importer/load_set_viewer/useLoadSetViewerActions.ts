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
import { useQueryClient } from "@grit42/api";
import { toast } from "@grit42/notifications";
import { useRollbackLoadSetBlockMutation } from "../mutations";
import { LoadSetData } from "../types";
import { invalidateLoadSet, invalidateEntityData } from "../invalidation";

interface UseLoadSetViewerActionsOptions {
  loadSet: LoadSetData;
  entityPath: string;
  confirm?: (msg: string) => boolean;
}

/**
 * Hook that encapsulates the rollback action logic for the LoadSetViewer.
 * Returns the rollback handler and pending state.
 */
export function useLoadSetViewerActions({
  loadSet,
  entityPath,
  confirm: confirmFn = window.confirm.bind(window),
}: UseLoadSetViewerActionsOptions) {
  const queryClient = useQueryClient();
  const blockId = loadSet.load_set_blocks[0].id;

  const rollbackMutation = useRollbackLoadSetBlockMutation(blockId);

  const handleRollback = useCallback(async () => {
    if (
      !confirmFn(
        `Are you sure you want to rollback this data load? Irreversible data loss may occur`,
      )
    ) {
      return;
    }
    try {
      await rollbackMutation.mutateAsync();
      await invalidateLoadSet(queryClient, loadSet.id);
      await invalidateEntityData(queryClient, entityPath);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }, [rollbackMutation, queryClient, loadSet.id, entityPath, confirmFn]);

  return {
    handleRollback,
    isPending: {
      rollback: rollbackMutation.isPending,
    },
  };
}
