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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getURLParams } from "@grit42/api";
import {
  Button,
  ButtonGroup,
  ErrorPage,
} from "@grit42/client-library/components";
import { useDestroyEntityMutation } from "../../entities";
import { LoadSetData } from "../types";
import { getLoadSetPropertiesForCancel } from "../utils/mappings";
import UpdateLoadSetDataDialog from "./UpdateLoadSetDataDialog";

interface LoadSetBlockErrorProps {
  load_set: LoadSetData;
}

const LoadSetBlockError = ({ load_set }: LoadSetBlockErrorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const destroyLoadSetMutation = useDestroyEntityMutation(
    "grit/core/load_sets",
  );

  const handleCancel = async () => {
    await destroyLoadSetMutation.mutateAsync(load_set.id);
    navigate(
      `/core/load_sets/new?${getURLParams(getLoadSetPropertiesForCancel(load_set))}`,
    );
  };

  return (
    <>
      <ErrorPage error={load_set.load_set_blocks[0].error}>
        <ButtonGroup>
          <Button
            onClick={handleCancel}
            loading={destroyLoadSetMutation.isPending}
          >
            Cancel import
          </Button>
          <Button onClick={() => setIsOpen(true)}>Change data set</Button>
        </ButtonGroup>
      </ErrorPage>
      {isOpen && (
        <UpdateLoadSetDataDialog
          isOpen
          loadSet={load_set}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default LoadSetBlockError;
