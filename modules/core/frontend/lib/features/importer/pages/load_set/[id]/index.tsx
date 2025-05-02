/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { useImporter } from "../../../ImportersContext";
import { ErrorPage, Spinner } from "@grit/client-library/components";
import { LoadSetData } from "../../../types";
import { useEntityDatum } from "../../../../entities";
import DefaultNewLoadSet from "./NewLoadSet";
import DefaultLoadSetEditor from "./LoadSet";

const LoadSet = ({ entity, id }: { entity: string; id: string }) => {
  const {
    LoadSetCreator = DefaultNewLoadSet,
    LoadSetEditor = DefaultLoadSetEditor,
    SucceededLoadSet = DefaultLoadSetEditor,
  } = useImporter(entity);

  const { data, isLoading, isError, error } = useEntityDatum<LoadSetData>(
    "grit/core/load_sets",
    id.toString(),
    undefined,
    { enabled: id !== "new" },
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return <p>{error ?? "An error occurred"}</p>;
  }

  if (id === "new" && entity) {
    return <LoadSetCreator entity={entity} />;
  }

  if (data?.status_id__name === "Succeeded") {
    return <SucceededLoadSet id={id} loadSet={data} />;
  }

  if (id !== null && id !== undefined) {
    return <LoadSetEditor id={id} />;
  }

  return <Navigate to="/" />;
};

const LoadSetPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const entityParam = searchParams.get("entity");

  const {
    data: loadSet,
    isLoading,
    isError,
    error,
  } = useEntityDatum<LoadSetData>("grit/core/load_sets", id!, undefined, {
    enabled: id !== "new",
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !id || (!loadSet?.entity && !entityParam)) {
    return <ErrorPage error={error} />;
  }

  return (
    <LoadSet
      id={loadSet?.id.toString() ?? id}
      entity={(loadSet?.entity ?? entityParam)!}
    />
  );
};

export default LoadSetPage;
