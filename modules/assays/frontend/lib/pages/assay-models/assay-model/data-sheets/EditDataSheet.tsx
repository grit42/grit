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

import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ErrorPage, Spinner, Surface } from "@grit42/client-library/components";
import { Form, FormField, FormFieldDef, useForm } from "@grit42/form";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinitionFields,
  useAssayDataSheetDefinitions,
} from "../../../../queries/assay_data_sheet_definitions";
import DataSheetColumnsTable from "./DataSheetColumnsTable";
import styles from "../assayModel.module.scss";

const AssayDataSheetDefinitionForm = ({
  fields,
  sheetDefinition,
}: {
  fields: FormFieldDef[];
  sheetDefinition: Partial<AssayDataSheetDefinitionData>;
  sheets: AssayDataSheetDefinitionData[];
  onDeleteRedirectId: string;
}) => {
  const form = useForm<Partial<AssayDataSheetDefinitionData>>({
    defaultValues: sheetDefinition,
  });

  return (
    <Surface style={{ width: "100%" }}>
      <Form<Partial<AssayDataSheetDefinitionData>> form={form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gridAutoRows: "max-content",
            gap: "calc(var(--spacing) * 2)",
            paddingBottom: "calc(var(--spacing) * 2)",
          }}
        >
          {form.state.errorMap.onSubmit && (
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
                color: "var(--palette-error-main)",
              }}
            >
              {form.state.errorMap.onSubmit?.toString()}
            </div>
          )}
          {fields.map((f) => (
            <FormField
              form={form}
              fieldDef={{ ...f, disabled: true }}
              key={f.name}
            />
          ))}
        </div>
      </Form>
    </Surface>
  );
};

const EditDataSheet = ({ assayModelId }: { assayModelId: string }) => {
  const { sheet_id } = useParams() as { sheet_id: string | undefined };

  const { data, isLoading, isError, error } =
    useAssayDataSheetDefinitions(assayModelId);

  const sheetDefinition = useMemo(() => {
    return data?.find(({ id }) => id.toString() === sheet_id);
  }, [data, sheet_id]);

  const otherSheetDefinitions = useMemo(() => {
    return data?.filter(({ id }) => id.toString() !== sheet_id);
  }, [data, sheet_id]);

  const deleteRedirectId = useMemo(() => {
    return (
      data?.find(({ id }) => id.toString() !== sheet_id)?.id.toString() ?? "new"
    );
  }, [data, sheet_id]);

  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useAssayDataSheetDefinitionFields(undefined, {
    select: (fields) => fields.filter((f) => f.name !== "assay_model_id"),
  });

  if (isFieldsLoading || isLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields || isError || !data) {
    return <ErrorPage error={fieldsError ?? error} />;
  }

  if (!sheetDefinition) {
    return <Navigate to={`../${data.at(0)?.id.toString() ?? "new"}`} replace />;
  }

  return (
    <div className={styles.dataSheet}>
      <AssayDataSheetDefinitionForm
        key={sheet_id}
        sheetDefinition={sheetDefinition ?? {}}
        fields={fields}
        onDeleteRedirectId={deleteRedirectId}
        sheets={otherSheetDefinitions ?? []}
      />
      <DataSheetColumnsTable sheetId={sheet_id ?? ""} />
    </div>
  );
};

export default EditDataSheet;
