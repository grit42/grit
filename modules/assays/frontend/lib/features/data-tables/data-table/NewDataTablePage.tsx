/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useNavigate } from "react-router-dom";
import { DataTableData, useDataTableFields } from "../queries/data_tables";
import { FormFieldDef } from "@grit42/form";
import { FormPage, useCreateEntityMutation } from "@grit42/core";
import { useQueryClient } from "@grit42/api";
import {
  Button,
  ErrorPage,
  LoadingPage,
} from "@grit42/client-library/components";

const NewDataTableForm = () => {
  const navigate = useNavigate();

  const { data: fields } = useDataTableFields() as { data: FormFieldDef[] };
  const queryClient = useQueryClient();
  const createEntityMutation = useCreateEntityMutation<DataTableData>(
    "grit/assays/data_tables",
  );

  const handleSubmit = async (value: Partial<DataTableData>) => {
    const newEntity = await createEntityMutation.mutateAsync(
      value as DataTableData,
    );
    queryClient.setQueryData(
      ["entities", "datum", "grit/assays/data_tables", newEntity.id.toString()],
      newEntity,
    );
    navigate(`../${newEntity.id}`, {
      relative: "path",
      replace: true,
    });
  };

  return (
    <FormPage header={<FormPage.Header>New data table</FormPage.Header>}>
      <FormPage.Body>
        <FormPage.Form
          defaultValues={{}}
          fields={fields}
          onSubmit={handleSubmit}
        >
          <Link to="..">
            <Button>Cancel</Button>
          </Link>
        </FormPage.Form>
      </FormPage.Body>
    </FormPage>
  );
};

const NewDataTablePage = () => {
  const fields = useDataTableFields();

  if (fields.isLoading) {
    return <LoadingPage />;
  }

  if (fields.isError || !fields.data) {
    return (
      <ErrorPage error={fields.error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return <NewDataTableForm />;
};

export default NewDataTablePage;
