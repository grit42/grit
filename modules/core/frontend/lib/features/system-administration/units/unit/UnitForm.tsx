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
  genericErrorHandler,
} from "@grit42/form";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useCreateUnit, useEditUnit } from "../mutations";
import { Unit } from "../types";

const FIELDS = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "abbreviation",
    display_name: "Abbreviation",
    type: "string",
    required: true,
  },
  {
    name: "unit_type",
    display_name: "Unit type",
    type: "string",
    required: false,
  },
  {
    name: "si_unit",
    display_name: "SI unit",
    type: "string",
    required: false,
  },
];

function UnitForm({ unit = {} }: { unit?: Partial<Unit> }) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const createUnit = useCreateUnit();
  const editUnit = useEditUnit(unit.id ?? 0);

  const form = useForm({
    defaultValues: unit,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const updatedUnit = unit.id
        ? await editUnit.mutateAsync(value)
        : await createUnit.mutateAsync(value);
      if (!unit.id) {
        navigate(`../${updatedUnit.id}`, { relative: "path" });
      } else {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["entities", "datum", "grit/core/units"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "data", "grit/core/units"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "infiniteData", "grit/core/units"],
          }),
        ]);
        formApi.reset(updatedUnit, {
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
        {!unit.id && (
          <Link to="/core/administration/units">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
}

export default UnitForm;
