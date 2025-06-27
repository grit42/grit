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

export interface ModuleNavItem {
  name: string;
  path: string;
  roles?: string[];
}

export interface ModuleMeta {
  rootRoute: string;
  navItems: ModuleNavItem[];
}

const Meta: ModuleMeta = {
  rootRoute: "/core",
  navItems: [
    {
      name: "Vocabularies",
      path: "/core/vocabularies",
    },
    {
      name: "Administration",
      path: "/core/administration",
      roles: ["Administrator"],
    },
  ],
};

export default Meta;
