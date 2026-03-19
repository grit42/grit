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

import { useParams } from "react-router-dom";
import { useState } from "react";
import {
  useForm,
  FormField,
  Form,
  FormControls,
  FormFields,
} from "@grit42/form";
import { ErrorPage, Spinner, Surface } from "@grit42/client-library/components";
import { useEntityDatum } from "../../../../../entities";
import { Role } from "../../types";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";
import styles from "./role.module.scss";

const FIELDS = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
    disabled: true,
  },
  {
    name: "description",
    display_name: "Description",
    type: "string",
    required: false,
    disabled: true,
  },
];

function RoleForm({ role }: { role: Role }) {
  const [formData] = useState<Role>(role);

  const form = useForm({
    defaultValues: formData,
  });

  return (
    <Form form={form}>
      <FormFields columns={1}>
        {FIELDS.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls />
    </Form>
  );
}

export default function RoleDetails() {
  const { id } = useParams();

  const { data, isLoading, isError, error } = useEntityDatum<Role>(
    "grit/core/roles",
    id ?? "new",
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <CenteredColumnLayout>
      <Surface className={styles.surface}>
        <RoleForm role={data} />
      </Surface>
    </CenteredColumnLayout>
  );
}
