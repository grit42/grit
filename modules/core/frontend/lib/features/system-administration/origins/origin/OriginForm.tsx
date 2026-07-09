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
import { useCreateOrigin, useEditOrigin } from "../mutations";
import { Origin } from "../types";

const FIELDS = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "domain",
    display_name: "Domain",
    type: "string",
    required: false,
  },
  {
    name: "status",
    display_name: "Status",
    type: "string",
    required: false,
  },
];

function OriginForm({ origin = {} }: { origin?: Partial<Origin> }) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const createOrigin = useCreateOrigin();
  const editOrigin = useEditOrigin(origin.id ?? 0);

  const form = useForm({
    defaultValues: origin,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const updatedOrigin = origin.id
        ? await editOrigin.mutateAsync(value)
        : await createOrigin.mutateAsync(value);
      if (!origin.id) {
        navigate(`../${updatedOrigin.id}`, { relative: "path" });
      } else {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["entities", "datum", "grit/core/origins"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "data", "grit/core/origins"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["entities", "infiniteData", "grit/core/origins"],
          }),
        ]);
        formApi.reset(updatedOrigin, {
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
        {!origin.id && (
          <Link to="/core/administration/origins">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
}

export default OriginForm;
