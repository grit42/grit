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

import { useCallback, useEffect } from "react";
import { useToolbar } from "../../toolbar";
import { toast } from "@grit42/notifications";
import { downloadFile } from "@grit42/client-library/utils";

export const useExportAction = ({
  exportId,
  exportText,
  endpoint,
}: {
  exportId: string;
  exportText: string;
  endpoint: string;
}) => {
  const registerToolbarActions = useToolbar();

  const handleExport = useCallback(async () => {
    const toastId = toast("Preparing file...", {
      autoClose: false,
      type: "default",
      isLoading: true,
    });

    downloadFile(endpoint);
    toast.dismiss(toastId);
  }, [endpoint]);

  useEffect(() => {
    return registerToolbarActions({
      exportItems: [
        {
          id: exportId,
          text: exportText,
          onClick: handleExport,
        },
      ],
    });
  }, [registerToolbarActions, handleExport, exportId, exportText]);
};
