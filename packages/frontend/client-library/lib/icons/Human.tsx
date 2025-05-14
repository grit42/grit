/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { SVGProps, memo } from "react";

const SvgHuman = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M8.083 5a3.5 3.5 0 0 1 3.5 3.5v2a.5.5 0 0 1-.5.5h-.548l-.454 4.55a.5.5 0 0 1-.414.443L9.583 16h-3a.5.5 0 0 1-.497-.45L5.63 11h-.547a.5.5 0 0 1-.492-.41l-.008-.09v-2a3.5 3.5 0 0 1 3.5-3.5Zm0 1a2.5 2.5 0 0 0-2.5 2.5V10h.5a.5.5 0 0 1 .483.367l.015.083.454 4.55H9.13l.456-4.55a.5.5 0 0 1 .413-.443l.084-.007h.5V8.5a2.5 2.5 0 0 0-2.335-2.495Zm0-6a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgHuman);
export default Memo;
