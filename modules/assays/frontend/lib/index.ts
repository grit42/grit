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

import { lazy } from "react";
import Registrant from "./registrant";
import Meta from "./meta";
import { GritModule } from "@grit42/core";

export { default as Registrant } from "./registrant";
export { default as Meta } from "./meta";
export const Router = lazy(() => import("./router"));

export default {
  Meta,
  Router,
  Registrant,
} as GritModule;
