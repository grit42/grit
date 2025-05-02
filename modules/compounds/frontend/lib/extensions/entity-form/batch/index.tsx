/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/compounds.
 *
 * @grit/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
} from "@grit/form";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit/client-library/components";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit/core";
import {
  BatchData,
  BatchField,
  useBatch,
  useBatchFields,
} from "../../../queries/batches";

export interface EntityDetailsProps {
  entity: string;
  id: string | number;
}

export const BatchDetails = ({ id }: EntityDetailsProps) => {
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: BatchData;
  };

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useBatchFields(initialData?.compound_type_id);

  const {
    data: datum,
    isLoading: isDatumLoading,
    isError: isDatumError,
    error: datumError,
  } = useBatch(id.toString(), undefined, {
    enabled: id !== "new",
  });

  if (!initialData?.compound_type_id) {
    return (
      <Surface style={{ width: 960 }}>
        <ErrorPage error="No compound type specified">
          <Link to="/compounds">
            <Button color="secondary">Go to compounds</Button>
          </Link>
        </ErrorPage>
      </Surface>
    );
  }

  if (isFieldsLoading || isDatumLoading) {
    return <Spinner />;
  }

  if (isFieldsError || isDatumError || !fields || (id !== "new" && !datum)) {
    return <ErrorPage error={fieldsError ?? datumError} />;
  }

  return (
    <EntityForm
      key={id}
      id={id.toString()}
      fields={fields}
      data={datum ?? undefined}
    />
  );
};

const EntityForm = ({
  id,
  fields,
  data,
}: {
  id: string;
  fields: BatchField[];
  data?: BatchData;
}) => {
  const navigate = useNavigate();
  const { redirect, initialData } = (useLocation().state ?? {}) as {
    redirect?: string;
    initialData?: BatchData;
  };
  const [formData, setFormData] = useState<BatchData>(
    data ?? ((initialData ?? {}) as BatchData),
  );

  const createEntityMutation = useCreateEntityMutation(
    "grit/compounds/batches",
  );

  const editEntityMutation = useEditEntityMutation(
    "grit/compounds/batches",
    id,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/batches",
  );

  const form = useForm<Partial<BatchData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<BatchData>>(formValue, fields);
      if (id === "new") {
        const newEntity = await createEntityMutation.mutateAsync(value);
        navigate(redirect ?? `../${newEntity.id}`, {
          relative: redirect ? undefined : "path",
        });
      } else {
        setFormData((await editEntityMutation.mutateAsync(value)) as BatchData);
        if (redirect) {
          navigate(redirect);
        } else {
          formApi.reset();
        }
      }
    }),
  });

  const compound_type_id = useStore(
    form.baseStore,
    (state) => state.values.compound_type_id,
  );

  const fieldsForInitialData = useMemo(
    () =>
      fields.map((f) => {
        const field = { ...f } as FormFieldDef;
        if (initialData && Object.hasOwn(initialData, f.name)) {
          field.hidden = true;
        }
        if (f.name === "number" && !data) {
          field.hidden = true;
        }
        if (f.name === "number" && data?.id) {
          field.disabled = true;
        }
        return field;
      }),
    [fields, data, initialData, compound_type_id],
  );

  const onDelete = async () => {
    if (id !== "new") {
      try {
        if (
          !window.confirm(
            `Are you sure you want to delete this batch? This action is irreversible`,
          )
        )
          return;
        await destroyEntityMutation.mutateAsync(id);
        navigate(redirect ?? "..", {
          relative: redirect ? undefined : "path",
        });
      } catch (e: unknown) {
        if (typeof e === "string") {
          form.setErrorMap({ onSubmit: e });
        } else {
          throw e;
        }
      }
    }
  };

  return (
    <Surface style={{ width: 960 }}>
      <Form form={form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridAutoRows: "max-content",
            gap: "calc(var(--spacing) * 2)",
            paddingBottom: "calc(var(--spacing) * 2)",
          }}
        >
          {form.state.errorMap.onSubmit && (
            <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
              {form.state.errorMap.onSubmit?.toString()}
            </div>
          )}
          {fieldsForInitialData.map((f) => (
            <FormField form={form} fieldDef={f} key={f.name} />
          ))}
        </div>
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={id !== "new"}
        />
      </Form>
    </Surface>
  );
};

export default BatchDetails;
