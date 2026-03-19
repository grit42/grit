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

import { useMemo } from "react";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useLoadSetBlockMappingFields } from "../queries";
import { LoadSetData } from "../types";
import { getAutoMappings } from "../utils/mappings";
import { LOAD_SET_BLOCK_STATUS, getBlockStatus } from "../constants";
import LoadSetEditor from "./LoadSetEditor";
import LoadSetBlockInitializer from "./LoadSetBlockInitializer";
import LoadSetBlockError from "./LoadSetBlockError";

interface LoadSetEditorWrapperProps {
  loadSet: LoadSetData;
}

const LoadSetEditorWrapper = ({ loadSet }: LoadSetEditorWrapperProps) => {
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useLoadSetBlockMappingFields(loadSet.load_set_blocks[0].id);

  const mappings = useMemo(
    () =>
      loadSet?.load_set_blocks[0].mappings &&
      Object.keys(loadSet.load_set_blocks[0].mappings).length
        ? loadSet.load_set_blocks[0].mappings
        : getAutoMappings(fields, loadSet?.load_set_blocks[0].headers),
    [fields, loadSet.load_set_blocks],
  );

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  const status = getBlockStatus(loadSet);

  if (status === LOAD_SET_BLOCK_STATUS.CREATED) {
    return (
      <LoadSetBlockInitializer load_set_block={loadSet.load_set_blocks[0]} />
    );
  }

  if (status === LOAD_SET_BLOCK_STATUS.ERRORED) {
    return <LoadSetBlockError load_set={loadSet} />;
  }

  return (
    <LoadSetEditor loadSet={loadSet} mappings={mappings} fields={fields} />
  );
};

export default LoadSetEditorWrapper;
