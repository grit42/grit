// /**
//  * Copyright 2025 grit42 A/S. <https://grit42.com/>
//  *
//  * This file is part of @grit42/core.
//  *
//  * @grit42/core is free software: you can redistribute it and/or modify it
//  * under the terms of the GNU General Public License as published by the Free
//  * Software Foundation, either version 3 of the License, or  any later version.
//  *
//  * @grit42/core is distributed in the hope that it will be useful, but
//  * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
//  * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
//  * more details.
//  *
//  * You should have received a copy of the GNU General Public License along with
//  * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
//  */

// import { useNavigate, useParams } from "react-router-dom";
// import {
//   Surface,
// } from "@grit42/client-library/components";
// import {
//   DataTableRowData,
// } from "../queries/vocabulary_items";
// import {
//   Form,
//   FormControls,
//   FormField,
//   FormFieldDef,
//   genericErrorHandler,
//   getVisibleFieldData,
//   useForm,
// } from "@grit42/form";
// import {
//   useCreateEntityMutation,
//   useDestroyEntityMutation,
//   useEditEntityMutation,
// } from "../../entities";
// import { useQueryClient } from "@grit42/api";

// const VocabularyItemForm = ({
//   fields,
//   vocabularyItem,
// }: {
//   fields: FormFieldDef[];
//   vocabularyItem: Partial<DataTableRowData>;
// }) => {
//   const { vocabulary_id } = useParams() as { vocabulary_id: string };
//   const navigate = useNavigate();
//   const queryClient = useQueryClient();

//   const createEntityMutation = useCreateEntityMutation<DataTableRowData>(
//     "grit/core/vocabulary_items",
//   );

//   const editEntityMutation = useEditEntityMutation<DataTableRowData>(
//     "grit/core/vocabulary_items",
//     vocabularyItem.id ?? -1,
//   );

//   const destroyEntityMutation = useDestroyEntityMutation(
//     "grit/core/vocabulary_items",
//   );

//   const form = useForm<Partial<DataTableRowData>>({
//     defaultValues: vocabularyItem,
//     onSubmit: genericErrorHandler(async ({ value: formValue }) => {
//       const value = {
//         ...getVisibleFieldData<Partial<DataTableRowData>>(formValue, fields),
//         vocabulary_id: Number(vocabulary_id),
//       };
//       if (!vocabularyItem.id) {
//         const newEntity = await createEntityMutation.mutateAsync(
//           value as DataTableRowData,
//         );
//         queryClient.setQueryData(
//           [
//             "entities",
//             "datum",
//             "grit/core/vocabulary_items",
//             newEntity.id.toString(),
//           ],
//           newEntity,
//         );
//       } else {
//         await editEntityMutation.mutateAsync(value as DataTableRowData);
//       }
//       navigate("..");
//     }),
//   });

//   const onDelete = async () => {
//     if (
//       !vocabularyItem.id ||
//       !window.confirm(
//         `Are you sure you want to delete this vocabulary item? This action is irreversible`,
//       )
//     )
//       return;
//     await destroyEntityMutation.mutateAsync(vocabularyItem.id);
//     navigate("..");
//   };

//   return (
//     <Surface style={{ width: "100%" }}>
//       <Form<Partial<DataTableRowData>> form={form}>
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr",
//             gridAutoRows: "max-content",
//             gap: "calc(var(--spacing) * 2)",
//             paddingBottom: "calc(var(--spacing) * 2)",
//           }}
//         >
//           {form.state.errorMap.onSubmit && (
//             <div
//               style={{
//                 gridColumnStart: 1,
//                 gridColumnEnd: -1,
//                 color: "var(--palette-error-main)",
//               }}
//             >
//               {form.state.errorMap.onSubmit?.toString()}
//             </div>
//           )}
//           {fields.map((f) => (
//             <FormField form={form} fieldDef={f} key={f.name} />
//           ))}
//         </div>
//         <FormControls
//           form={form}
//           onDelete={onDelete}
//           showDelete={!!vocabularyItem.id}
//           showCancel
//           onCancel={() => navigate("..")}
//         />
//       </Form>
//     </Surface>
//   );
// };

// export default VocabularyItemForm;
