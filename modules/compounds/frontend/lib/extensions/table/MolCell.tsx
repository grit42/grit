/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/compounds.
 *
 * @grit/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { CellContext, ColumnDefTemplate } from "@tanstack/table-core";
import { CompoundData } from "../../queries/compounds";
import { AsyncMoleculeViewer } from "../../components/MoleculeViewer";

const MolCell: ColumnDefTemplate<CellContext<CompoundData, string>> = (
  info,
) => (
  <div
    style={{
      height: 300,
    }}
  >
    <AsyncMoleculeViewer
      id={`molecule-viewer-${info.row.original.id}`}
      molfile={info.getValue() ?? ""}
    />
  </div>
);

export default MolCell;
