/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  useForm,
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  FormFields,
  FormBanner,
} from "@grit42/form";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useCreateEntityMutation } from "@grit42/core";
import {
  BatchData,
  BatchField,
  useBatchFields,
} from "../../../../queries/batches";
import styles from "./batches.module.scss";

const NewBatchPage = () => {
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: BatchData;
  };

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useBatchFields(initialData?.compound_type_id);

  if (!initialData?.compound_type_id) {
    return (
      <ErrorPage error="No compound type specified">
        <Link to="/compounds">
          <Button color="secondary">Go to compounds</Button>
        </Link>
      </ErrorPage>
    );
  }

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  return <BatchForm fields={fields} />;
};

const BatchForm = ({ fields }: { fields: BatchField[] }) => {
  const navigate = useNavigate();
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: BatchData;
  };
  const createEntityMutation = useCreateEntityMutation(
    "grit/compounds/batches",
  );

  const form = useForm({
    defaultValues: initialData ?? {},
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = getVisibleFieldData<Partial<BatchData>>(formValue, fields);
      await createEntityMutation.mutateAsync(value);
      navigate("..");
    }),
  });

  const fieldsForInitialData = useMemo(
    () =>
      fields.map((f) => {
        const field = { ...f } as FormFieldDef;
        if (initialData && Object.hasOwn(initialData, f.name)) {
          field.hidden = true;
        }
        if (f.name === "number") {
          field.hidden = true;
          field.disabled = true;
        }
        return field;
      }),
    [fields, initialData],
  );

  return (
    <div className={styles.batchPage}>
      <h1>New batch</h1>
      <Surface>
        <Form form={form}>
          <FormFields columns={1}>
            <FormBanner content={form.state.errorMap.onSubmit} />
            {fieldsForInitialData.map((f) => (
              <FormField fieldDef={f} key={f.name} />
            ))}
          </FormFields>
          <FormControls>
            <Link to="../">
              <Button>Cancel</Button>
            </Link>
          </FormControls>
        </Form>
      </Surface>
    </div>
  );
};

export default NewBatchPage;
