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

import { useCallback, useEffect, useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { Tabs } from "@grit42/client-library/components";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { AssayDataSheetDefinitionData } from "../../../../../../queries/assay_data_sheet_definitions";
import styles from "../../assayModels.module.scss";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
}

const DataSheetTabs = ({ sheetDefinitions }: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  const match = useMatch(
    "/assays/settings/assay-models/:assay_model_id/data-sheets/:sheet_id/*",
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

export default DataSheetTabs;
