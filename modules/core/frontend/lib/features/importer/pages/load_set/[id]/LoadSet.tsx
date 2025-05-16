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

import { Spinner } from "@grit42/client-library/components";
import { useEntityDatum } from "../../../../entities";
import { LoadSetData } from "../../../types";
import MappingLoadSet from "./MappingLoadSet";
import SucceededLoadSet from "./SucceededLoadSet";
import ValidatedLoadSet from "./ValidatedLoadSet";

const LoadSet = ({ id }: { id: string | number }) => {
  const { data, isLoading, isError, error } = useEntityDatum<LoadSetData>(
    "grit/core/load_sets",
    id.toString(),
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <p>{error ?? "An error occurred"}</p>;
  }

  if (
    data.status_id__name === "Mapping" ||
    data.status_id__name === "Invalidated"
  ) {
    return <MappingLoadSet loadSet={data} />;
  }

  if (data.status_id__name === "Validated") {
    return <ValidatedLoadSet loadSet={data} />;
  }

  if (data.status_id__name === "Succeeded") {
    return <SucceededLoadSet loadSet={data} />;
  }

  return <p>{data.status_id__name}</p>;
};

export default LoadSet;
