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

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ErrorPage,
  Spinner,
  Surface,
  Tabs,
} from "@grit42/client-library/components";
import { keepPreviousData, useQueryClient } from "@grit42/api";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinitionFields,
  useAssayDataSheetDefinitions,
} from "../../../../../../../queries/assay_data_sheet_definitions";
import styles from "../../assayModels.module.scss";
import DataSheetColumns from "./DataSheetColumns";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
}

export const DataSheetTabs = ({ sheetDefinitions }: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  const match = useMatch(
    "/core/administration/assays/assay-models/:assay_model_id/data-sheets/:sheet_id/*",
  );

  const sheet_id = match?.params.sheet_id ?? 0;

  const [selectedTab, setSelectedTab] = useState(
    sheetDefinitions?.findIndex(({ id }) => sheet_id === id.toString()) ?? 0,
  );

  useEffect(() => {
    if (sheet_id === "new") {
      setSelectedTab(sheetDefinitions?.length ?? 0);
    } else {
      setSelectedTab(
        sheetDefinitions?.findIndex(({ id }) => sheet_id === id.toString()) ??
          0,
      );
    }
  }, [sheet_id, sheetDefinitions]);

  const handleTabChange = (index: number) => {
    if (index === sheetDefinitions?.length) {
      navigate("new", { replace: true });
    }
    if (
      selectedTab !== index &&
      sheetDefinitions?.length &&
      sheetDefinitions[index]
    ) {
      navigate(sheetDefinitions[index].id.toString(), { replace: true });
    }
  };

  const navigateToNew = useCallback(
    () => navigate("new", { replace: true }),
    [navigate],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New sheet",
          onClick: navigateToNew,
          disabled: sheet_id === "new",
        },
      ],
      importItems: [
        {
          id: "IMPORT_SHEETS",
          text: "Import data sheets",
          onClick: () => navigate("../data-sheet-loader/files"),
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, sheet_id, navigate]);

  return (
    <div className={styles.dataSheets}>
      <Tabs
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        tabs={[
          ...(sheetDefinitions?.map((sheetDefinition) => ({
            key: sheetDefinition.id.toString(),
            name: sheetDefinition.name,
            panel: <></>,
          })) ?? []),
          {
            key: "new",
            name: "+ New sheet",
            panel: <></>,
          },
        ]}
      />
      <Outlet />
    </div>
  );
};

const AssayDataSheetDefinitionForm = ({
  fields,
  sheetDefinition,
  onDeleteRedirectId,
}: {
  fields: FormFieldDef[];
  sheetDefinition: Partial<AssayDataSheetDefinitionData>;
  onDeleteRedirectId: string;
}) => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createEntityMutation =
    useCreateEntityMutation<AssayDataSheetDefinitionData>(
      "grit/assays/assay_data_sheet_definitions",
    );

  const editEntityMutation =
    useEditEntityMutation<AssayDataSheetDefinitionData>(
      "grit/assays/assay_data_sheet_definitions",
      sheetDefinition.id ?? -1,
    );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_data_sheet_definitions",
  );

  const form = useForm<Partial<AssayDataSheetDefinitionData>>({
    defaultValues: sheetDefinition,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetDefinitionData>>(
          formValue,
          fields,
        ),
        assay_model_id: Number(assay_model_id),
      };
      if (!sheetDefinition.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayDataSheetDefinitionData,
        );
        await queryClient.refetchQueries({
          queryKey: [
            "entities",
            "data",
            "grit/assays/assay_data_sheet_definitions",
          ],
        });
        await queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/assay_data_sheet_definitions",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        navigate(`../${newEntity.id}`, { replace: true });
      } else {
        formApi.reset(
          await editEntityMutation.mutateAsync(
            value as AssayDataSheetDefinitionData,
          ),
        );
      }
    }),
  });

  const onDelete = async () => {
    if (
      !sheetDefinition.id ||
      !window.confirm(
        `Are you sure you want to delete this data sheet? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(sheetDefinition.id);
    navigate(`../${onDeleteRedirectId}`, { replace: true });
  };

  return (
    <Surface style={{ width: "100%" }}>
      {!sheetDefinition.id && (
        <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
          New sheet
        </h2>
      )}
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
            <FormField form={form} fieldDef={f} key={f.name} />
          ))}
        </div>
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={!!sheetDefinition.id}
        />
      </Form>
    </Surface>
  );
};

const DataSheet = ({ assayModelId }: { assayModelId: string }) => {
  const { sheet_id } = useParams() as { sheet_id: string | undefined };

  const { data, isLoading, isError, error } = useAssayDataSheetDefinitions(
    assayModelId,
    undefined,
    undefined,
    undefined,
  );

  const sheetDefinition = useMemo(() => {
    if (sheet_id === "new") return {};
    return data?.find(({ id }) => id.toString() === sheet_id);
  }, [data, sheet_id]);

  const deleteRedirectId = useMemo(() => {
    if (sheet_id === "new") return "..";
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

  if (!sheet_id || (sheet_id !== "new" && !sheetDefinition)) {
    return <Navigate to={`../${data.at(0)?.id.toString() ?? "new"}`} replace />;
  }

  return (
    <div className={styles.dataSheet}>
      <AssayDataSheetDefinitionForm
        key={sheet_id}
        sheetDefinition={sheetDefinition ?? {}}
        fields={fields}
        onDeleteRedirectId={deleteRedirectId}
      />
      <DataSheetColumns />
    </div>
  );
};

const DataSheets = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data, isLoading, isError, error } = useAssayDataSheetDefinitions(
    assay_model_id,
    undefined,
    undefined,
    undefined,
    {
      placeholderData: keepPreviousData,
    },
  );

  const {
    data: fields,
    isLoading: isAssayDataSheetDefinitionFieldsLoading,
    isError: isAssayDataSheetDefinitionFieldsError,
    error: assayDataSheetDefinitionFieldsError,
  } = useAssayDataSheetDefinitionFields();

  if (isAssayDataSheetDefinitionFieldsLoading || isLoading) return <Spinner />;
  if (isAssayDataSheetDefinitionFieldsError || isError || !fields || !data)
    return <ErrorPage error={assayDataSheetDefinitionFieldsError ?? error} />;

  return (
    <Routes>
      <Route element={<DataSheetTabs sheetDefinitions={data} />}>
        <Route
          path=":sheet_id?/*"
          element={<DataSheet assayModelId={assay_model_id} />}
        />
      </Route>
    </Routes>
  );
};

export default DataSheets;
