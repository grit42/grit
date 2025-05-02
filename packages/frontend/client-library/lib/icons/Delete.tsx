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

const SvgDelete = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M15.636 2.045a.5.5 0 0 1 .09.992l-.09.008H14.46l-.969 11.632a1.591 1.591 0 0 1-1.441 1.453l-.145.006h-7.81a1.59 1.59 0 0 1-1.585-1.459L1.54 3.045H.364a.5.5 0 0 1-.09-.991l.09-.009h4.409v-.59c0-.83.635-1.512 1.446-1.585l.145-.006h3.272c.879 0 1.591.712 1.591 1.59v.59l4.41.001Zm-2.18 1H2.543l.963 11.55a.591.591 0 0 0 .489.533l.1.008h7.81a.591.591 0 0 0 .59-.542l.961-11.549ZM6.364 5.864a.5.5 0 0 1 .492.41l.008.09v5.454a.5.5 0 0 1-.992.09l-.008-.09V6.364a.5.5 0 0 1 .5-.5Zm3.272 0a.5.5 0 0 1 .492.41l.008.09v5.454a.5.5 0 0 1-.992.09l-.008-.09V6.364a.5.5 0 0 1 .5-.5Zm0-5H6.364a.59.59 0 0 0-.591.59l-.001.591h4.455v-.59A.591.591 0 0 0 9.732.87L9.636.864Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDelete);
export default Memo;
