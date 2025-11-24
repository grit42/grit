import { AssayDataSheetDefinitionData } from "../../../../../../../../queries/assay_data_sheet_definitions";
import {
  DataSetDefinitionFull,
} from "./dataSheetDefinitionEditorForm";
import {
  EndpointError,
  EndpointSuccess,
  notifyOnError,
  request,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@grit42/api";

export const useCreateBulkDataSheetDefinitionMutation = (
  mutationOptions: UseMutationOptions<
    AssayDataSheetDefinitionData[],
    string | Record<string, string[]>,
    DataSetDefinitionFull
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [
      "createBulkDataSheetDefinition",
      "grit/assays/assay_data_sheet_definitions/create_bulk",
    ],
    mutationFn: async (dataSheetDefinitions: DataSetDefinitionFull) => {
      const response = await request<
        EndpointSuccess<AssayDataSheetDefinitionData[]>,
        EndpointError<string | Record<string, string[]>>
      >("grit/assays/assay_data_sheet_definitions/create_bulk", {
        method: "POST",
        data: dataSheetDefinitions,
      });

      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        await queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/assay_data_sheet_definitions",
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            "grit/assays/assay_data_sheet_definitions",
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "infiniteData",
            "grit/assays/assay_data_sheet_definitions",
          ],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};
