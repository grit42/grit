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

const SvgBuilding = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0c.78 0 1.41.64 1.42 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm-.01.94H1.41a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM8.137 3.025l.075.035.023.015.096.071 4.611 4.131c.187.17.207.456.05.666a.465.465 0 0 1-.509.135l-.087-.04-.072-.053-.497-.444v4.164c0 .441-.224.829-.569.987l-.107.04-.103.025-.11.008h-1.46c-.38 0-.71-.26-.811-.628l-.022-.103-.007-.109v-2.35H7.366v2.35c0 .38-.26.71-.628.811l-.103.022-.108.007h-1.46a.892.892 0 0 1-.862-.673l-.022-.11-.006-.107-.001-4.364-.488.436a.431.431 0 0 1-.149.096l-.085.024-.087.008a.465.465 0 0 1-.354-.162.482.482 0 0 1-.072-.505l.046-.086.066-.076L7.67 3.112a.485.485 0 0 1 .466-.086Zm-.16 1.088-2.86 2.552v5.16h1.3v-2.35c0-.38.26-.71.629-.81l.103-.022.109-.008h1.47c.38 0 .71.26.81.629l.022.103.008.108-.001 2.34h1.36c-.064 0-.07-.009-.069-.022l.003-.012.007-.076-.001-5.01-2.89-2.582Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgBuilding);
export default Memo;
