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

const SvgSearch = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M4.297 1.19a5.87 5.87 0 0 1 6.787 9.185l3.825 3.827a.5.5 0 0 1-.638.765l-.069-.058-3.825-3.826a5.87 5.87 0 1 1-6.08-9.893Zm6.779 3.497a4.87 4.87 0 1 0-1.04 5.35l.014-.012a4.872 4.872 0 0 0 1.026-5.338Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgSearch);
export default Memo;
