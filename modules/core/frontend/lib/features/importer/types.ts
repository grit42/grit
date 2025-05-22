/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { EntityData } from "../entities";

export interface LoadSetMapping {
  header: string | null;
  find_by: string | null;
  constant: boolean;
  value: string | number | boolean | null;
}

export interface LoadSetData extends EntityData {
  entity: string;
  separator: string | null;
  origin_id: number;
  origin_id__name: string;
  status_id: number;
  status_id__name: string;
  mappings?: Record<string, LoadSetMapping>;
  record_errors?: LoadSetError[];
  record_warnings?: LoadSetWarning[];
}

export interface LoadSetPreviewData {
  headers: Array<string| null>;
  data: string[][];
}

export interface LoadSetError {
  index: number;
  datum: string[];
  errors: Record<string, string[]>;
}

export interface LoadSetWarning {
  index: number;
  warnings: Record<string, string[]>;
}
