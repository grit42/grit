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

const SvgSolidStore = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.37 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm0 .94H1.42a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM12.362 3c.347 0 .639.326.639.712v8.576c0 .397-.283.712-.639.712H3.64C3.283 13 3 12.685 3 12.288V3.712C3 3.315 3.283 3 3.639 3ZM7.71 4H4v8h3.709V4ZM12 4H8.409v8H12V4ZM9.65 7.02v1.66h-.7V7.02h.7Zm-2.44-.01v1.67h-.7V7.01h.7Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgSolidStore);
export default Memo;
