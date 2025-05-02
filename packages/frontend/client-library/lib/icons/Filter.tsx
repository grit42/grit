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

const SvgFilter = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.969.336H1a1 1 0 0 0-.998 1.067l.023.26a8.004 8.004 0 0 0 5.85 6.889l.107.026v6.188a1 1 0 0 0 1.64.768l2-1.667.093-.086a.999.999 0 0 0 .268-.682l-.001-4.52.109-.027a8.002 8.002 0 0 0 5.874-7.147A1.002 1.002 0 0 0 14.97.336ZM8.983 8.183v4.916l-2 1.667V8.183a.5.5 0 0 0-.4-.49l-.255-.057a7.003 7.003 0 0 1-5.304-6.043L1 1.335l13.968.002a7.001 7.001 0 0 1-5.585 6.356.5.5 0 0 0-.4.49Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgFilter);
export default Memo;
