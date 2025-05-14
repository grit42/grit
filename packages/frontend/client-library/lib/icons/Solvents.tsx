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

const SvgSolvents = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M10.333 0a1.5 1.5 0 0 1 .501 2.914l-.001 2.241.076.031a4.889 4.889 0 0 1 2.92 4.252l.004.224V14.5a1.5 1.5 0 0 1-1.5 1.5h-8a1.5 1.5 0 0 1-1.5-1.5V9.662a4.888 4.888 0 0 1 2.925-4.476l.075-.031v-2.24A1.5 1.5 0 0 1 6.334 0Zm-.5 3h-3v2.5a.5.5 0 0 1-.258.438l-.084.036a3.888 3.888 0 0 0-2.658 3.688V14.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.662a3.888 3.888 0 0 0-2.658-3.688.5.5 0 0 1-.342-.474V3Zm.5-2h-4a.5.5 0 0 0 0 1h4a.5.5 0 1 0 0-1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgSolvents);
export default Memo;
