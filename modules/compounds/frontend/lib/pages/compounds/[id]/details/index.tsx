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

import { ErrorPage, Spinner, Surface } from "@grit/client-library/components";
import {
  EntityData,
  EntityProperties,
  useEditEntityMutation,
  useDestroyEntityMutation,
  useHasRoles,
} from "@grit/core";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import {
  Form,
  FormControls,
  FormField,
  genericErrorHandler,
  getVisibleFieldData,
} from "@grit/form";
import { useCompound, useCompoundFields } from "../../../../queries/compounds";
import { AsyncMoleculeViewer } from "../../../../components/MoleculeViewer";
import styles from "./details.module.scss";

const CompoundDetails = () => {
  const canCrud = useHasRoles([
    "Administrator",
    "CompoundAdministrator",
    "CompoundUser",
  ]);
  const { id } = useParams() as { id: string };
  const { data: compound } = useCompound(id);
  const { data: fields } = useCompoundFields(compound?.compound_type_id);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EntityData>(compound!);

  const compoundTypeFields = useMemo(
    () =>
      fields
        ?.filter(
          (f) =>
            (f.compound_type_id === null ||
              f.compound_type_id === compound?.compound_type_id) &&
            f.name !== "molecule",
        )
        .map((f) =>
          ["compound_type_id", "number"].includes(f.name)
            ? { ...f, disabled: true }
            : { ...f, disabled: !canCrud },
        ) ?? [],
    [fields, compound],
  );

  const editEntityMutation = useEditEntityMutation(
    "grit/compounds/compounds",
    id,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/compounds",
  );

  const form = useForm<EntityData>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<EntityProperties>(
        formValue,
        compoundTypeFields,
      );
      setFormData(await editEntityMutation.mutateAsync(value));
      formApi.reset();
    }),
  });

  const onDelete = async () => {
    try {
      if (
        !window.confirm(
          `Are you sure you want to delete this Batch? This action is irreversible`,
        )
      )
        return;
      await destroyEntityMutation.mutateAsync(id);
      navigate("/compounds");
    } catch (e: unknown) {
      if (typeof e === "string") {
        form.setErrorMap({ onSubmit: e });
      } else {
        throw e;
      }
    }
  };

  return (
    <div className={styles.container}>
      <Surface style={{ width: "100%" }}>
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
            {compoundTypeFields!.map((f) => (
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
          </div>
          <FormControls
            form={form}
            onDelete={onDelete}
            showDelete={canCrud}
          />
        </Form>
      </Surface>

      {compound?.molecule && (
        <div className={styles.moleculeContainer}>
          <AsyncMoleculeViewer molfile={compound.molecule} />
        </div>
      )}
    </div>
  );
};

const CompoundDetailsPage = () => {
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useCompoundFields();

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  return <CompoundDetails />;
};

export default CompoundDetailsPage;
