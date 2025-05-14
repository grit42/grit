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

const SvgPlate = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.37 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm0 .94H1.42a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM5 10.2a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm-6-3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm-6-3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgPlate);
export default Memo;
