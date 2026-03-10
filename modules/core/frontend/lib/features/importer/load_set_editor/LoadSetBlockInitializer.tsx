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

import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useCallback, useEffect, useRef } from "react";
import { useInitializeLoadSetBlockMutation } from "../mutations";
import { LoadSetBlockData } from "../types";
import {
  invalidateLoadSet,
  invalidatePreviewData,
  invalidateErroredData,
} from "../invalidation";

interface LoadSetBlockInitializerProps {
  load_set_block: LoadSetBlockData;
}

const LoadSetBlockInitializer = ({
  load_set_block,
}: LoadSetBlockInitializerProps) => {
  const fetchRef = useRef(false);
  const queryClient = useQueryClient();

  const initializeMutation = useInitializeLoadSetBlockMutation(
    load_set_block.id,
  );

  const handleInitialize = useCallback(async () => {
    try {
      await initializeMutation.mutateAsync();
    } finally {
      await Promise.all([
        invalidateLoadSet(queryClient, load_set_block.load_set_id),
        invalidatePreviewData(queryClient, load_set_block.id),
        invalidateErroredData(queryClient, load_set_block.id),
      ]);
    }
  }, [
    initializeMutation,
    load_set_block.id,
    load_set_block.load_set_id,
    queryClient,
  ]);

  useEffect(() => {
    if (load_set_block.status_id__name === "Created" && !fetchRef.current) {
      handleInitialize();
      fetchRef.current = true;
    }
  }, [handleInitialize, load_set_block.status_id__name]);

  return (
    <ErrorPage error="Preparing the upload">
      <Spinner />
    </ErrorPage>
  );
};

export default LoadSetBlockInitializer;
