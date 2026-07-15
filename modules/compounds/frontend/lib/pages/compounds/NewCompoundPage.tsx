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
import { useMemo, useState } from "react";
import {
  useForm,
  useStore,
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  isFieldVisible,
  requiredValidator,
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
  CompoundData,
  CompoundField,
  useCompoundFields,
} from "../../queries/compounds";
import { EndpointError, EndpointSuccess, request } from "@grit42/api";
import MoleculeInput from "../../components/MoleculeInput";
import styles from "./compounds.module.scss";
import { useCompoundsBreadcrumbs } from "./breadcrumbs";

interface ExistingMoleculeInfo {
  molfile: string;
  existing_molecule_id: number | null;
  existing_molecule_compounds: CompoundData[];
}

const NewCompoundPage = () => {
  useCompoundsBreadcrumbs();
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: CompoundData;
  };

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useCompoundFields(initialData?.compound_type_id);

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

  return <CompoundForm fields={fields} />;
};

const CompoundForm = ({ fields }: { fields: CompoundField[] }) => {
  const navigate = useNavigate();
  const { initialData } = (useLocation().state ?? {}) as {
    initialData?: CompoundData;
  };
  const [existingInfo, setExistingMoleculeInfo] =
    useState<ExistingMoleculeInfo>();
  const createEntityMutation = useCreateEntityMutation(
    "grit/compounds/compounds",
  );

  const form = useForm({
    defaultValues: { compound_type_id: initialData?.compound_type_id },
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = getVisibleFieldData<Partial<CompoundData>>(
        formValue,
        fields,
      );
      const newEntity = await createEntityMutation.mutateAsync(value);
      navigate(`/compounds/${newEntity.id}`);
    }),
  });

  const [compound_type_id] = useStore(form.store, (state) => [
    state.values.compound_type_id,
  ]) as [number | undefined];

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
        if (f.name === "compound_type_id") {
          field.disabled = true;
        }
        return field;
      }),
    [fields, initialData, compound_type_id],
  );

  return (
    <div className={styles.newCompoundPage}>
      <h1>New compound</h1>
      <Surface>
        <Form form={form}>
          <FormFields>
            <FormBanner content={form.state.errorMap.onSubmit} />
            {fieldsForInitialData.map((f) => {
              if (f.name === "molecule") {
                return (
                  <div className={styles.moleculeField} key={f.name}>
                    <form.Field
                      name={f.name as any}
                      validators={{
                        onChange: ({ value }) => requiredValidator(f, value),
                        onChangeAsync: async ({ value }) => {
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
                        return (
                          <MoleculeInput
                            height={200}
                            label={f.display_name}
                            onChange={field.handleChange}
                            value={field.state.value as string}
                            error={
                              field.getMeta().isValidating
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
              return <FormField fieldDef={f} key={f.name} />;
            })}
          </FormFields>
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
          <FormControls>
            <Link to="/compounds">
              <Button>Cancel</Button>
            </Link>
          </FormControls>
        </Form>
      </Surface>
    </div>
  );
};

export default NewCompoundPage;
