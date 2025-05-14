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

const SvgFilterDelete = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M13.657 2.343A8 8 0 1 1 2.343 13.657 8 8 0 0 1 13.657 2.343Zm-.707.707a7 7 0 1 0-9.9 9.9 7 7 0 0 0 9.9-9.9Zm-2.122 2.122a.5.5 0 0 1 .058.637l-.058.07L8.708 8l2.12 2.121a.5.5 0 0 1-.637.765l-.07-.058L8 8.708l-2.121 2.12a.5.5 0 0 1-.765-.637l.058-.07L7.292 8l-2.12-2.121a.5.5 0 0 1 .637-.765l.07.058L8 7.292l2.121-2.12a.5.5 0 0 1 .707 0Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgFilterDelete);
export default Memo;
