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

import { useEffect } from "react";
import {
  EntityFormFieldDef,
  LoadSetBlockData,
  LoadSetData,
  PendingLoadSetBlock,
  useRegisterImporter,
} from "@grit42/core";
import ExperimentDataSheetRecordLoadSetViewerExtraActions from "./experiment-data-sheet-record/ExperimentDataSheetRecordLoadSetViewerExtraActions";
import {
  EndpointError,
  EndpointSuccess,
  notifyOnError,
  request,
} from "@grit42/api";
import { AssayDataSheetDefinitionData } from "../../queries/assay_data_sheet_definitions";
import { FormFieldDef } from "@grit42/form";

interface PendingExperimentDataSheetRecordLoadSetBlock extends PendingLoadSetBlock {
  experiment_id?: number;
  assay_data_sheet_definition_id?: number;
}

interface ExperimentDataSheetRecordLoadSetBlockData extends LoadSetBlockData {
  experiment_id?: number;
  assay_data_sheet_definition_id?: number;
}

const refineExperimentDataSheetRecordLoadSetBlocks = async (
  blocks: PendingLoadSetBlock[],
): Promise<PendingExperimentDataSheetRecordLoadSetBlock[]> => {
  if (
    blocks.length === 0 ||
    (blocks[0] as PendingExperimentDataSheetRecordLoadSetBlock)
      .experiment_id === undefined
  ) {
    return blocks;
  }
  const experimentDataSheetRecordBlocks =
    blocks as PendingExperimentDataSheetRecordLoadSetBlock[];
  const experimentId = experimentDataSheetRecordBlocks[0].experiment_id;
  const response = await request<
    EndpointSuccess<AssayDataSheetDefinitionData[]>,
    EndpointError
  >(`/grit/assays/experiments/${experimentId}/assay_data_sheet_definitions`, {
    method: "GET",
  });

  if (!response.success) {
    notifyOnError(response.errors);
    return experimentDataSheetRecordBlocks;
  }

  const assayDataSheetDefinitionIdsByName: Record<string, number> =
    response.data.reduce((acc, { id, name }) => ({ ...acc, [name]: id }), {});

  for (const block of experimentDataSheetRecordBlocks) {
    if (assayDataSheetDefinitionIdsByName[block.name]) {
      block.assay_data_sheet_definition_id =
        assayDataSheetDefinitionIdsByName[block.name];
    }
  }

  return experimentDataSheetRecordBlocks;
};

const refineExperimentDataSheetRecordLoadSetBlockFields = (
  block: PendingLoadSetBlock | null | undefined,
  fields: FormFieldDef[],
) => {
  const refinedFields = fields;
  const experiment_id = (
    block as PendingExperimentDataSheetRecordLoadSetBlock | null | undefined
  )?.experiment_id;
  const assayDataSheetDefinitionFieldIdx = fields.findIndex(({ name }) =>
    name.endsWith("assay_data_sheet_definition_id"),
  );

  if (experiment_id && assayDataSheetDefinitionFieldIdx > -1) {
    fields[assayDataSheetDefinitionFieldIdx] = {
      ...fields[assayDataSheetDefinitionFieldIdx],
      entity: {
        ...(fields[assayDataSheetDefinitionFieldIdx] as EntityFormFieldDef)
          .entity,
        params: {
          ...((fields[assayDataSheetDefinitionFieldIdx] as EntityFormFieldDef)
            .entity.params ?? {}),
          scope: "by_experiment",
          experiment_id: experiment_id.toString(),
        },
      },
    } as EntityFormFieldDef;
  }
  return refinedFields;
};

const refineExperimentDataSheetRecordLoadSetBlockCancelUrlParams = (
  _loadSet: LoadSetData,
  blocks: ExperimentDataSheetRecordLoadSetBlockData[],
): Record<string, string> => {
  if (blocks.length === 0 || !blocks[0].experiment_id) return {};
  return { experiment_id: blocks[0].experiment_id.toString() };
};

const useRegisterExperimentDataSheetRecordImporter = () => {
  const registerImporter = useRegisterImporter();

  useEffect(() => {
    const unregisterExperimentDataSheetRecordImporter = registerImporter(
      "Grit::Assays::ExperimentDataSheetRecord",
      {
        refineBlocks: refineExperimentDataSheetRecordLoadSetBlocks,
        refineBlockFields: refineExperimentDataSheetRecordLoadSetBlockFields,
        refineCancelUrlParams:
          refineExperimentDataSheetRecordLoadSetBlockCancelUrlParams,
        LoadSetBlockViewerExtraActions:
          ExperimentDataSheetRecordLoadSetViewerExtraActions,
      },
    );

    return () => {
      unregisterExperimentDataSheetRecordImporter();
    };
  }, [registerImporter]);

  return null;
};

export default useRegisterExperimentDataSheetRecordImporter;
