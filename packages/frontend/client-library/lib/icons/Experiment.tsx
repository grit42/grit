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

const SvgExperiment = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m12.699 1 .089.015a.5.5 0 0 1 .378.517l-.014.09L11.306 9h1.36V7.5a.5.5 0 0 1 .993-.09l.008.09v7a1.5 1.5 0 0 1-1.356 1.493l-.144.007h-7.5a1.5 1.5 0 0 1-1.493-1.356l-.007-.144-.001-8.31-.707-.506-.124-.13a1 1 0 0 1 .71-1.547L3.167 4h6a.5.5 0 0 1 .09.992L9.167 5H3.222l.652.468a.5.5 0 0 1 .112.11l.041.067.084.164a.5.5 0 0 1 .05.15l.006.078-.001.463h1a.5.5 0 0 1 .09.992l-.09.008h-1V9h1a.5.5 0 0 1 .09.992l-.09.008h-1v1.5h1a.5.5 0 0 1 .09.992l-.09.008h-1v2a.5.5 0 0 0 .41.492l.09.008h7.5a.5.5 0 0 0 .493-.41l.008-.09-.001-4.5h-1.61l-.353 1.416c.253.242.422.571.457.94l.007.144a1.5 1.5 0 1 1-1.391-1.496l.25-1.004h-1.86a.5.5 0 0 1-.09-.992L8.167 9h2.11l1.906-7.621A.5.5 0 0 1 12.699 1ZM9.667 12a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgExperiment);
export default Memo;
