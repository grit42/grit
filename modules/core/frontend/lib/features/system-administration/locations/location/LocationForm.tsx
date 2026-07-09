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

import { Link, useNavigate } from "react-router-dom";
import {
  useForm,
  FormField,
  Form,
  FormControls,
  FormFields,
  FieldDef,
  genericErrorHandler,
} from "@grit42/form";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { EntityFormFieldDef } from "../../../entities/types";
import { useCreateLocation, useEditLocation } from "../mutations";
import { Location } from "../types";

const FIELDS: FieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "print_address",
    display_name: "Print address",
    type: "text",
    required: false,
  },
  {
    name: "country_id",
    display_name: "Country",
    type: "entity",
    required: true,
    entity: {
      name: "Country",
      full_name: "Grit::Core::Country",
      path: "grit/core/countries",
      column: "country_id",
      primary_key: "id",
      primary_key_type: "integer",
      display_column: "name",
      display_column_type: "string",
    },
  } as EntityFormFieldDef,
  {
    name: "origin_id",
    display_name: "Origin",
    type: "entity",
    required: true,
    entity: {
      name: "Origin",
      full_name: "Grit::Core::Origin",
      path: "grit/core/origins",
      column: "origin_id",
      primary_key: "id",
      primary_key_type: "integer",
      display_column: "name",
      display_column_type: "string",
    },
  } as EntityFormFieldDef,
];

function LocationForm({ location = {} }: { location?: Partial<Location> }) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const createLocation = useCreateLocation();
  const editLocation = useEditLocation(location.id ?? 0);

  const form = useForm({
    defaultValues: location,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const updatedLocation = location.id
        ? await editLocation.mutateAsync(value)
        : await createLocation.mutateAsync(value);
      if (!location.id) {
        navigate(`../${updatedLocation.id}`, { relative: "path" });
      } else {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["entities", "datum", "grit/core/locations"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "data", "grit/core/locations"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "infiniteData", "grit/core/locations"],
          }),
        ]);
        formApi.reset(updatedLocation, {
          keepDefaultValues: false,
        });
      }
    }),
  });

  return (
    <Form form={form}>
      <FormFields columns={1}>
        {FIELDS.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls>
        {!location.id && (
          <Link to="/core/administration/locations">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
}

export default LocationForm;
