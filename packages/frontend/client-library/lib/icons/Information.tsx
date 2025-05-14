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

const SvgInformation = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.5 5.5a1 1 0 0 1 .993.883L8.5 7.5V10a.5.5 0 0 0 .41.492L9 10.5h.5a.5.5 0 0 1 .09.992l-.09.008H9a1.5 1.5 0 0 1-1.493-1.356L7.5 10V7.5H7a.5.5 0 0 1-.09-.992L7 6.5h.5ZM7.75 4l.102.007a.75.75 0 1 1-.204 0L7.75 4Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgInformation);
export default Memo;
