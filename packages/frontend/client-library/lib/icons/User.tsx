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

const SvgUser = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0c.78 0 1.41.64 1.42 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm-.01.94H1.41a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM8.149 3.295a2.944 2.944 0 0 1 .624 5.823 4.474 4.474 0 0 1 3.603 2.957.5.5 0 0 1-.944.33 3.477 3.477 0 0 0-6.566 0 .5.5 0 0 1-.944-.33 4.478 4.478 0 0 1 3.605-2.959 2.944 2.944 0 0 1 .623-5.821ZM6.246 5.843l-.02.097a1.944 1.944 0 0 0 3.831.668 4.566 4.566 0 0 1-3.811-.765Zm1.902-1.547a1.94 1.94 0 0 0-1.44.638 3.563 3.563 0 0 0 3.273.659 1.943 1.943 0 0 0-1.833-1.297Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgUser);
export default Memo;
