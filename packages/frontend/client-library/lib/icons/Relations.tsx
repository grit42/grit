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

const SvgRelations = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M4 0a2 2 0 0 1 1.995 2.138l3.539 1.503a3.5 3.5 0 1 1 .716 4.54L8.596 9.635a4.5 4.5 0 1 1-.524-.872l1.51-1.328a3.503 3.503 0 0 1-.454-2.878l-3.45-1.468A2 2 0 1 1 4 0Zm.5 8a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8-5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM4 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgRelations);
export default Memo;
