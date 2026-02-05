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

import { useParams, useSearchParams } from "react-router-dom";
import { useImporter } from "../../../ImportersContext";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { LoadSetData } from "../../../types";
import { useEntityDatum } from "../../../../entities";

const NewLoadSet = ({ entity }: { entity: string }) => {
  const { LoadSetCreator } = useImporter(entity);

  return <LoadSetCreator entity={entity} />;
};

const LoadSet = ({ id }: { id: string }) => {
  const { data, isLoading, isError, error } = useEntityDatum<LoadSetData>(
    "grit/core/load_sets",
    id.toString(),
  );

  const { LoadSetEditor, LoadSetViewer } = useImporter(data?.entity);

  if (isLoading) {
    return <Spinner />;
  }

  if (!data || isError) {
    return <ErrorPage error={error} />;
  }

  if (data.load_set_blocks[0].status_id__name === "Succeeded") {
    return <LoadSetViewer loadSet={data} />;
  }

  return <LoadSetEditor loadSet={data} />;
};

const LoadSetPage = () => {
  const { id } = useParams() as { id: string };
  const [searchParams] = useSearchParams();
  const entityParam = searchParams.get("entity");

  if (id === "new") {
    return entityParam ? <NewLoadSet entity={entityParam} /> : <ErrorPage error="Entity not specified"/>
  }

  return <LoadSet id={id} />
};

export default LoadSetPage;
