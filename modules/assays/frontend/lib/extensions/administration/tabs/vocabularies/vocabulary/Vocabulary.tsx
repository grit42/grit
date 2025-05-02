/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { Table, useSetupTableState } from "@grit/table";
import styles from "./vocabulary.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useToolbar } from "@grit/core/Toolbar";
import Circle1NewIcon from "@grit/client-library/icons/Circle1New";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit/client-library/components";
import { useTableColumns } from "@grit/core/utils";
import {
  useVocabulary,
  useVocabularyFields,
  VocabularyData,
} from "../../../../../queries/vocabularies";
import {
  useVocabularyItem,
  useVocabularyItemColumns,
  useVocabularyItemFields,
  useVocabularyItems,
  VocabularyItemData,
} from "../../../../../queries/vocabulary_items";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit/form";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit/core";
import { useQueryClient } from "@grit/api";

interface Props {
  vocabularyId: string | number;
}

const VocabularyForm = ({
  fields,
  vocabulary,
}: {
  fields: FormFieldDef[];
  vocabulary: Partial<VocabularyData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<VocabularyData>>(vocabulary);

  const createEntityMutation = useCreateEntityMutation<VocabularyData>(
    "grit/assays/vocabularies",
  );

  const editEntityMutation = useEditEntityMutation<VocabularyData>(
    "grit/assays/vocabularies",
    vocabulary.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/vocabularies",
  );

  const form = useForm<Partial<VocabularyData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<VocabularyData>>(
        formValue,
        fields,
      );
      if (!vocabulary.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as VocabularyData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/vocabularies",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate(`../${newEntity.id}`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as VocabularyData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !vocabulary.id ||
      !window.confirm(
        `Are you sure you want to delete this vocabulary? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(vocabulary.id);
    navigate("..");
  };

  return (
    <Surface style={{ width: "100%" }}>
      <Form<Partial<VocabularyData>> form={form}>
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
          showDelete={!!vocabulary.id}
          showCancel
          cancelLabel="Back"
          onCancel={() => navigate("..")}
        />
      </Form>
    </Surface>
  );
};

const VocabularyItemForm = ({
  fields,
  vocabularyItem,
}: {
  fields: FormFieldDef[];
  vocabularyItem: Partial<VocabularyItemData>;
}) => {
  const { vocabulary_id } = useParams() as { vocabulary_id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createEntityMutation = useCreateEntityMutation<VocabularyItemData>(
    "grit/assays/vocabulary_items",
  );

  const editEntityMutation = useEditEntityMutation<VocabularyItemData>(
    "grit/assays/vocabulary_items",
    vocabularyItem.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/vocabulary_items",
  );

  const form = useForm<Partial<VocabularyItemData>>({
    defaultValues: vocabularyItem,
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<VocabularyItemData>>(formValue, fields),
        vocabulary_id: Number(vocabulary_id),
      };
      if (!vocabularyItem.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as VocabularyItemData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/vocabulary_items",
            newEntity.id.toString(),
          ],
          newEntity,
        );
      } else {
        await editEntityMutation.mutateAsync(value as VocabularyItemData);
      }
      navigate("..");
    }),
  });

  const onDelete = async () => {
    if (
      !vocabularyItem.id ||
      !window.confirm(
        `Are you sure you want to delete this vocabulary item? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(vocabularyItem.id);
    navigate("..");
  };

  return (
    <Surface style={{ width: "100%" }}>
      <Form<Partial<VocabularyItemData>> form={form}>
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
          showDelete={!!vocabularyItem.id}
          showCancel
          onCancel={() => navigate("..")}
        />
      </Form>
    </Surface>
  );
};

export const VocabularyItem = () => {
  const { vocabulary_item_id } = useParams() as { vocabulary_item_id: string };

  const {
    data: vocabularyItem,
    isLoading: isVocabularyItemLoading,
    isError: isVocabularyItemError,
    error: vocabularyItemError,
  } = useVocabularyItem(vocabulary_item_id);
  const {
    data: vocabularyItemFields,
    isLoading: isVocabularyItemFieldsLoading,
    isError: isVocabularyItemFieldsError,
    error: vocabularyItemFieldsError,
  } = useVocabularyItemFields(undefined, {
    select: (fields) => fields.filter((f) => f.name !== "vocabulary_id"),
  });

  if (isVocabularyItemLoading || isVocabularyItemFieldsLoading)
    return <Spinner />;

  if (isVocabularyItemError || isVocabularyItemFieldsError) {
    return (
      <ErrorPage error={vocabularyItemError ?? vocabularyItemFieldsError} />
    );
  }

  return (
    <VocabularyItemForm
      fields={vocabularyItemFields!}
      vocabularyItem={vocabularyItem!}
    />
  );
};

export const VocabularyItemsTable = ({ vocabularyId }: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: columns } = useVocabularyItemColumns();

  const destroyItemsMutation = useDestroyEntityMutation(
    "grit/assays/vocabulary_items",
  );

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("vocabulary-items", tableColumns, {
    settings: {
      enableSelection: true,
      disableVisibilitySettings: true,
    },
    saveState: {
      filters: false,
    },
  });

  const { data: vocabularyItems, isLoading: isVocabularyItemsLoading } =
    useVocabularyItems(
      vocabularyId,
      tableState.sorting,
      tableState.filters,
      undefined,
      { enabled: vocabularyId !== "new" },
    );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New item",
          onClick: navigateToNew,
          disabled: vocabularyId === "new",
        },
      ],
      importItems: [{
        id: "IMPORT ITEMS",
        text: "Import items",
        onClick: () => navigate("/core/load_sets/new?entity=Grit::Assays::VocabularyItem")
      }]
    });
  }, [registerToolbarActions, navigateToNew]);

  return (
    <>
      {vocabularyId !== "new" && (
        <Table
          tableState={tableState}
          header="Items"
          loading={isVocabularyItemsLoading}
          headerActions={
            <Button disabled={vocabularyId === "new"} onClick={navigateToNew}>
              New
            </Button>
          }
          rowActions={["delete"]}
          onDelete={async (rows) => {
            if (
              !window.confirm(
                `Are you sure you want to delete ${rows.length > 1 ? `${rows.length} items` : "this item"}? This action is irreversible`,
              )
            )
              return;
            await destroyItemsMutation.mutateAsync(
              rows.map(({ original }) => original.id),
            );
            await queryClient.invalidateQueries({
              queryKey: ["entityData", "grit/assays/vocabulary_items", vocabularyId.toString()],
            });
          }}
          className={styles.typesTable}
          data={vocabularyItems ?? []}
          onRowClick={(row) => {
            queryClient.setQueryData(
              [
                "entities",
                "datum",
                "grit/assays/vocabulary_items",
                row.original.id.toString(),
              ],
              row.original,
            );
            navigate(row.original.id.toString());
          }}
        />
      )}
    </>
  );
};

const Vocabulary = ({ vocabularyId }: Props) => {
  const { data: vocabulary } = useVocabulary(vocabularyId);
  const { data: vocabularyFields } = useVocabularyFields();

  return (
    <div className={styles.vocabulary}>
      <VocabularyForm fields={vocabularyFields!} vocabulary={vocabulary!} />
      <Outlet />
    </div>
  );
};

export default Vocabulary;
