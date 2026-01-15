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

import { useEffect, useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { ErrorPage, Tabs } from "@grit42/client-library/components";
import { AssayDataSheetDefinitionData } from "../../../../queries/assay_data_sheet_definitions";
import styles from "./dataSheets.module.scss";

interface Props {
  sheetDefinitions: AssayDataSheetDefinitionData[];
}

const DataSheetTabs = ({ sheetDefinitions }: Props) => {
  const navigate = useNavigate();

  const match = useMatch(
    "/assays/assay-models/:assay_model_id/data-sheets/:sheet_id",
  );

  const sheet_id = match?.params.sheet_id ?? 0;

  const [selectedTab, setSelectedTab] = useState(
    sheetDefinitions?.findIndex(({ id }) => sheet_id === id.toString()) ?? 0,
  );

  useEffect(() => {
    setSelectedTab(
      sheetDefinitions?.findIndex(({ id }) => sheet_id === id.toString()) ?? 0,
    );
  }, [sheet_id, sheetDefinitions]);

  const handleTabChange = (index: number) => {
    if (
      selectedTab !== index &&
      sheetDefinitions?.length &&
      sheetDefinitions[index]
    ) {
      navigate(sheetDefinitions[index].id.toString(), { replace: true });
    }
  };

  if (sheetDefinitions.length === 0) {
    return <ErrorPage error="This model does not define any data sheets"/>
  }

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
        ]}
      />
      <Outlet />
    </div>
  );
};

export default DataSheetTabs;
