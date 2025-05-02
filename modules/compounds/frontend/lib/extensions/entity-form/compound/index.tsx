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
  isFieldVisible,
  requiredValidator,
} from "@grit/form";
import { Button, ErrorPage, Spinner, Surface } from "@grit/client-library/components";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit/core";
import {
  CompoundData,
  CompoundField,
  useCompound,
  useCompoundFields,
} from "../../../queries/compounds";
import { EndpointError, EndpointSuccess, request } from "@grit/api";
import MoleculeInput from "../../../components/MoleculeInput";
import { AsyncMoleculeViewer } from "../../../components/MoleculeViewer";

export interface EntityDetailsProps {
  entity: string;
  id: string | number;
}

interface ExistingMoleculeInfo {
  molfile: string;
  existing_molecule_id: number | null;
  existing_molecule_compounds: CompoundData[];
}

export const CompoundDetails = ({ id }: EntityDetailsProps) => {
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: CompoundData;
  };

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useCompoundFields(initialData?.compound_type_id);

  const {
    data: datum,
    isLoading: isDatumLoading,
    isError: isDatumError,
    error: datumError,
  } = useCompound(id.toString(), undefined, {
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
  fields: CompoundField[];
  data?: CompoundData;
}) => {
  const navigate = useNavigate();
  const { redirect, redirectWithId, initialData } = (useLocation().state ??
    {}) as {
    redirect?: string;
    redirectWithId?: string;
    initialData?: CompoundData;
  };
  const [existingInfo, setExistingMoleculeInfo] =
    useState<ExistingMoleculeInfo>();
  const [formData, setFormData] = useState<CompoundData>(
    data ?? ((initialData ?? {}) as CompoundData),
  );

  const createEntityMutation = useCreateEntityMutation(
    "grit/compounds/compounds",
  );

  const editEntityMutation = useEditEntityMutation(
    "grit/compounds/compounds",
    id,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/compounds",
  );

  const form = useForm<Partial<CompoundData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<CompoundData>>(
        formValue,
        fields,
      );
      if (id === "new") {
        const newEntity = await createEntityMutation.mutateAsync(value);
        const redirectPath = redirectWithId
          ? `${redirectWithId}/${newEntity.id}`
          : redirect;
        navigate(redirectPath ?? `../${newEntity.id}`, {
          relative: redirectPath ? undefined : "path",
        });
      } else {
        setFormData(
          (await editEntityMutation.mutateAsync(value)) as CompoundData,
        );
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

  const [compound_type_id] = useStore(form.baseStore, (state) => [
    state.values.compound_type_id,
  ]);

  const fieldsForInitialData = useMemo(
    () =>
      fields.map((f) => {
        const field = { ...f } as FormFieldDef;
        field.hidden =
          (f.compound_type_id && f.compound_type_id !== compound_type_id) ||
          !isFieldVisible(field, null);
        if (initialData && Object.hasOwn(initialData, f.name)) {
          field.hidden = true;
        }
        if (["molweight", "logp", "molformula", "number"].includes(f.name)) {
          field.hidden = true;
        }
        if (f.name === "compound_type_id" && formData.compound_type_id) {
          field.disabled = true;
        }
        if (f.name === "molecule" && id !== "new") {
          field.disabled = true;
        }
        return field;
      }),
    [fields, initialData, compound_type_id, id, formData.compound_type_id],
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
      <Form<Partial<CompoundData>> form={form}>
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
          {fieldsForInitialData.map((f) => {
            if (f.name === "molecule") {
              return (
                <div
                  style={{
                    gridColumnStart: 1,
                    gridColumnEnd: 3,
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gridAutoRows: "max-content",
                  }}
                  key={f.name}
                >
                  <form.Field
                    name={f.name as any}
                    validators={{
                      onChange: ({ value }) => requiredValidator(f, value),
                      onChangeAsync: async ({ value }) => {
                        if (id !== "new") return undefined;
                        try {
                          const response = await request<
                            EndpointSuccess<ExistingMoleculeInfo>,
                            EndpointError
                          >("/grit/compounds/molecules/molecule_exists", {
                            method: "POST",
                            data: {
                              molfile: value,
                            },
                          });

                          if (!response.success) {
                            throw response.errors;
                          }

                          setExistingMoleculeInfo(response.data);
                        } catch (e) {
                          return (e as Error).message;
                        }
                        return undefined;
                      },
                    }}
                    children={(field) => {
                      if (id !== "new") {
                        return (
                          <div style={{ height: 300, width: "100%" }}>
                            <AsyncMoleculeViewer
                              molfile={data!.molecule as string}
                            />
                          </div>
                        );
                      }
                      return (
                        <MoleculeInput
                          height={200}
                          label={f.display_name}
                          onChange={field.handleChange}
                          value={field.state.value as string}
                          error={
                            field.getMeta().isValidating && id !== "new"
                              ? "Checking if this molecule is already registered..."
                              : Array.from(
                                  new Set(field.state.meta.errors),
                                ).join("\n")
                          }
                        />
                      );
                    }}
                  />
                </div>
              );
            }
            return (
              <FormField<Partial<CompoundData>>
                form={form}
                fieldDef={f}
                key={f.name}
              />
            );
          })}
        </div>
        {existingInfo?.existing_molecule_id &&
          existingInfo.existing_molecule_compounds.length > 0 && (
            <p>
              This structure is already registered
              <br />
              {existingInfo.existing_molecule_compounds.length} compound
              {existingInfo.existing_molecule_compounds.length > 1
                ? "s are "
                : " is "}
              linked to this structure:
              <ul>
                {existingInfo.existing_molecule_compounds
                  .slice(0, 3)
                  .map((c) => (
                    <li>{`${c.number} (${c.name})`}</li>
                  ))}
                {existingInfo.existing_molecule_compounds.length > 3
                  ? `and ${existingInfo.existing_molecule_compounds.length - 3} other`
                  : ""}
              </ul>
              Saving will link the new compound to the existing structure.
            </p>
          )}
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={id !== "new"}
        />
      </Form>
    </Surface>
  );
};

export default CompoundDetails;
