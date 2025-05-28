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
import { useSearchParams } from "react-router-dom";
import { useLoadSetFields } from "../queries";
import { useMemo } from "react";
import NewLoadSetForm from "./NewLoadSetForm";
import { NewLoadSetData } from "../types";

export interface LoadSetCreatorProps {
  entity: string;
}

const LoadSetCreator = ({ entity }: LoadSetCreatorProps) => {
  const [searchParams] = useSearchParams();
  const {
    data: loadSetFields,
    isLoading,
    isError,
    error,
  } = useLoadSetFields(entity);

  const initialValues = useMemo((): Partial<NewLoadSetData> => {
    const values: Partial<NewLoadSetData> = {
      entity,
      name: `${entity}-${new Date().toISOString()}`,
      data: "",
      separator: null,
    };
    if (!loadSetFields) return values;
    for (const field of loadSetFields) {
      if (searchParams.has(field.name)) {
        switch (field.type) {
          case "integer": {
            const paramValue = searchParams.get(field.name);
            values[field.name] = paramValue !== null ? Number(paramValue) : null;
            break;
          }
          default:
            values[field.name] = searchParams.get(field.name);
        }
      }
    }
    return values;
  }, [loadSetFields, entity, searchParams]);

  if (isLoading) return <Spinner />;
  if (isError || !loadSetFields) return <ErrorPage error={error} />;

  return (
    <NewLoadSetForm
      initialValues={initialValues}
      fields={loadSetFields}
      entity={entity}
    />
  );
};

export default LoadSetCreator;
