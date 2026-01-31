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
import { useMemo } from "react";
import NewLoadSetForm from "./NewLoadSetForm";
import { NewLoadSetData } from "../types";
import { useEntityFields } from "../../entities";

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
  } = useEntityFields("Grit::Core::LoadSet", undefined, {
    select: (fields) =>
      fields.map((f) => (f.name === "entity" ? { ...f, disabled: true } : f)),
  });

  const {
    data: loadSetBlockFields,
    isLoading: isLoadSetBlockFieldsLoading,
    isError: isLoadSetBlockFieldsError,
    error: loadSetBlockFieldsError,
  } = useEntityFields("Grit::Core::LoadSetBlock", undefined, {
    select: (fields) =>
      fields.map((f) => (f.name === "entity" ? { ...f, disabled: true } : f)),
  });

  const initialValues = useMemo((): Partial<NewLoadSetData> => {
    const values: Partial<NewLoadSetData> = {
      entity,
      name: `${entity}-${new Date().toISOString()}`,
      load_set_blocks: [{
        name: "",
        separator: ",",
        data: ""
      }],
    };
    if (!loadSetFields) return values;
    for (const field of loadSetFields) {
      if (searchParams.has(field.name)) {
        switch (field.type) {
          case "integer": {
            const paramValue = searchParams.get(field.name);
            values[field.name] =
              paramValue !== null ? Number(paramValue) : null;
            break;
          }
          default:
            values[field.name] = searchParams.get(field.name);
        }
      }
    }
    return values;
  }, [loadSetFields, entity, searchParams]);

  if (isLoading || isLoadSetBlockFieldsLoading) return <Spinner />;
  if (isError || !loadSetFields || isLoadSetBlockFieldsError || !loadSetBlockFields) return <ErrorPage error={error ?? loadSetBlockFieldsError} />;

  return (
    <NewLoadSetForm
      initialValues={initialValues}
      loadSetFields={loadSetFields}
      loadSetBlockFields={loadSetBlockFields}
      entity={entity}
    />
  );
};

export default LoadSetCreator;
