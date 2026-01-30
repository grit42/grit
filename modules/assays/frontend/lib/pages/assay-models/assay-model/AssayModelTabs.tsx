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

import { useMatch, useNavigate } from "react-router-dom";
import { Tabs } from "@grit42/client-library/components";

const ITEMS = [
  {
    identifier: "experiments",
    label: "Experiments",
  },
  {
    identifier: "data",
    label: "Data",
  },
  {
    identifier: "data-sheets",
    label: "Data sheets",
  },
  {
    identifier: "metadata",
    label: "Metadata",
  },
];

const AssayModelTabs = () => {
  const navigate = useNavigate();
  const match = useMatch("/assays/assay-models/:assay_model_id/:tab/*");

  const tabIndex = match?.params.tab
    ? ITEMS.findIndex(({ identifier }) => identifier === match.params.tab)
    : 0;

  return (
    <Tabs
      selectedTab={tabIndex}
      onTabChange={(index) => navigate(ITEMS[index].identifier)}
      tabs={ITEMS.map(({ identifier, label }) => ({
        key: identifier,
        name: label,
        panel: <></>,
      }))}
    />
  );
};

export default AssayModelTabs;
