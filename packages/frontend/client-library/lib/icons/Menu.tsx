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

const SvgMenu = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 4.233 4.233"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <g fillRule="evenodd" strokeWidth={0.265}>
      <circle cx={2.117} cy={0.635} r={0.529} />
      <circle cx={2.117} cy={2.117} r={0.529} />
      <circle cx={2.117} cy={3.598} r={0.529} />
    </g>
  </svg>
);

const Memo = memo(SvgMenu);
export default Memo;
