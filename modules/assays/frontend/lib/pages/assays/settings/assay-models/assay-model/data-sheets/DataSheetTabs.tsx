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

import { useCallback, useEffect, useMemo } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { ErrorPage, RoutedTabs } from "@grit42/client-library/components";
import { useToolbar } from "@grit42/core";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { AssayDataSheetDefinitionData } from "../../../../../../queries/assay_data_sheet_definitions";
import { AssayModelData } from "../../../../../../queries/assay_models";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
  assayModel: AssayModelData;
}

const DataSheetTabs = ({ sheetDefinitions, assayModel }: Props) => {
  const { canEdit } = useAssayModelEditorContext();
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  const match = useMatch(
    "/assays/assay-models/settings/assay-models/:assay_model_id/data-sheets/:sheet_id/*",
  );

  const sheet_id = match?.params.sheet_id ?? 0;

  const navigateToNew = useCallback(
    () => navigate("../new", { replace: true }),
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
          disabled:
            sheet_id === "new" ||
            assayModel.publication_status_id__name === "Published",
        },
      ],
      importItems:
        assayModel.publication_status_id__name === "Published"
          ? undefined
          : [
              {
                id: "IMPORT_SHEETS",
                text: "Import data sheets",
                onClick: () =>
                  navigate("../../data-sheet-loader/files", {
                    relative: "path",
                  }),
              },
            ],
    });
  }, [
    registerToolbarActions,
    navigateToNew,
    sheet_id,
    navigate,
    assayModel.publication_status_id__name,
  ]);

  const tabs = useMemo(() => {
    const baseTabs = sheetDefinitions.map((sheetDefinition) => ({
      url: sheetDefinition.id.toString(),
      label: sheetDefinition.name,
    }));

    if (canEdit) {
      baseTabs.push({
        url: "new",
        label: "+ New sheet",
      });
    }

    return baseTabs;
  }, [sheetDefinitions, canEdit]);

  if (!canEdit && sheetDefinitions.length === 0) {
    return <ErrorPage error="This model does not define any data sheets" />;
  }

  return (
    <RoutedTabs
      matchPattern="/assays/assay-models/settings/assay-models/:assay_model_id/data-sheets/:sheet_id/*"
      tabs={tabs}
      replaceNavigation={true}
    />
  );
};

export default DataSheetTabs;
