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

const SvgNotEqual = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.36 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm-.01.94H1.41a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48Zm-3.597 3.018a.5.5 0 0 1 .162.62l-.046.078L10.127 6H11a.5.5 0 0 1 .09.992L11 7H9.413L7.984 9H11a.5.5 0 0 1 .09.992L11 10H7.27l-1.181 1.656a.5.5 0 0 1-.86-.504l.046-.077L6.042 10H5a.5.5 0 0 1-.09-.992L5 9h1.756l1.429-2H5a.5.5 0 0 1-.09-.992L5 6h3.899l1.376-1.925a.5.5 0 0 1 .698-.117Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgNotEqual);
export default Memo;
