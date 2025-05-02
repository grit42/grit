/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEntity, useEntityDatum, useEntityFields } from "../../../queries";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../../mutations";
import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Form,
  FormControls,
  FormField,
  genericErrorHandler,
  getVisibleFieldData,
  FormFieldDef,
} from "@grit/form";
import { EntityData, EntityInfo, EntityProperties } from "../../../types";
import { ErrorPage, Spinner, Surface } from "@grit/client-library/components";
import { useEntityForm } from "../../../EntityFormsContext";

const EntityDetailsPage = () => {
  const { title } = (useLocation().state ?? {}) as {
    title?: string;
  };
  const { entity, id = "new" } = useParams();
  const Form = useEntityForm(entity!);

  return (
    <>
      <h1>{title ?? `${id === "new" ? "Create" : "Edit"} ${entity}`}</h1>
      <Form entity={entity!} id={id} />
    </>
  );
};

export interface EntityDetailsProps {
  entity: string;
  id: string | number;
}

export const EntityDetails = ({ entity, id }: EntityDetailsProps) => {
  const {
    data: info,
    isLoading: isInfoLoading,
    isError: isInfoError,
    error: infoError,
  } = useEntity(entity!);
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useEntityFields(entity!);

  const {
    data: datum,
    isLoading: isDatumLoading,
    isError: isDatumError,
    error: datumError,
  } = useEntityDatum(info?.path ?? "", id.toString(), undefined, {
    enabled: !!info && !!fields && id !== "new",
  });

  if (isInfoLoading || isFieldsLoading || isDatumLoading) {
    return <Spinner />;
  }

  if (
    isInfoError ||
    isFieldsError ||
    isDatumError ||
    !info ||
    !fields ||
    (id !== "new" && !datum)
  ) {
    return (
      <ErrorPage error={infoError ?? fieldsError ?? datumError} />
    );
  }

  return (
    <EntityForm
      key={id}
      id={id.toString()}
      info={info}
      fields={fields}
      data={datum ?? undefined}
    />
  );
};

const EntityForm = ({
  id,
  info,
  fields,
  data,
}: {
  id: string;
  info: EntityInfo;
  fields: FormFieldDef[];
  data?: EntityData;
}) => {
  const navigate = useNavigate();
  const { redirect, redirectWithId, initialData } = (useLocation().state ??
    {}) as {
    redirect?: string;
    redirectWithId?: string;
    initialData?: EntityProperties;
  };
  const [formData, setFormData] = useState<EntityData>({
    ...(data ?? ((initialData ?? {}) as EntityData)),
    ...fields.reduce(
      (acc, f) =>
        f.type === "boolean"
          ? { ...acc, [f.name]: data?.[f.name] ?? false }
          : acc,
      {},
    ),
  });

  const fieldsForInitialData = useMemo(
    () =>
      fields.map((f) =>
        initialData && Object.hasOwn(initialData, f.name)
          ? { ...f, hidden: true }
          : f,
      ),
    [fields, initialData],
  );

  const createEntityMutation = useCreateEntityMutation(info.path);

  const editEntityMutation = useEditEntityMutation(info.path, id);

  const destroyEntityMutation = useDestroyEntityMutation(info.path);

  const form = useForm<EntityData>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<EntityProperties>(formValue, fields);
      if (id === "new") {
        const newEntity = await createEntityMutation.mutateAsync(value);
        const redirectPath = redirectWithId
          ? `${redirectWithId}/${newEntity.id}`
          : redirect;
        navigate(redirectPath ?? `../${newEntity.id}`, {
          relative: redirectPath ? undefined : "path",
          replace: redirectPath ? false : true,
        });
      } else {
        setFormData(await editEntityMutation.mutateAsync(value));
        const redirectPath = redirectWithId
          ? `${redirectWithId}/${id}`
          : redirect;
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          formApi.reset();
        }
      }
    }),
  });

  const onDelete = async () => {
    if (id !== "new") {
      if (!window.confirm(`Are you sure you want to delete this record? This action is irreversible`)) return;
      await destroyEntityMutation.mutateAsync(id);
      navigate(redirect ?? "..", {
        relative: redirect ? undefined : "path",
      });
    }
  };

  return (
    <Surface style={{ width: 960 }}>
      <Form<EntityData> form={form}>
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
            <div style={{ gridColumnStart: 1, gridColumnEnd: -1, color: "var(--palette-error-main)" }}>
              {form.state.errorMap.onSubmit?.toString()}
            </div>
          )}
          {fieldsForInitialData.map((f) => (
            <FormField<EntityData> form={form} fieldDef={f} key={f.name} />
          ))}
        </div>
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={id !== "new"}
          showCancel={id !== "new"}
          onCancel={() => navigate(-1)}
        />
      </Form>
    </Surface>
  );
};

export default EntityDetailsPage;
