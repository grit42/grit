/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { SVGProps, memo } from "react";

const SvgPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3a.5.5 0 0 1 .492.41l.008.09v3h3a.5.5 0 0 1 .09.992l-.09.008h-3v3a.5.5 0 0 1-.992.09L7.5 11.5v-3h-3a.5.5 0 0 1-.09-.992L4.5 7.5h3v-3A.5.5 0 0 1 8 4Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgPlus);
export default Memo;
