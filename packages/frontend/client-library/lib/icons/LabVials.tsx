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

const SvgLabVials = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M7 0a.5.5 0 0 1 .5.5V9h1V.5a.5.5 0 0 1 .41-.492L9 0h4a.5.5 0 0 1 .5.5V9h1V7a.5.5 0 0 1 .992-.09L15.5 7v6.5a2.5 2.5 0 0 1-2.336 2.495L13 16H3a2.5 2.5 0 0 1-2.495-2.336L.5 13.5V7a.5.5 0 0 1 .992-.09L1.5 7v2h1V.5a.5.5 0 0 1 .41-.492L3 0ZM2.5 10h-1v3.5a1.5 1.5 0 0 0 1.356 1.493L3 15h10a1.5 1.5 0 0 0 1.493-1.356l.007-.144V10h-1v.5a2.5 2.5 0 0 1-2.336 2.495L11 13a2.5 2.5 0 0 1-2.5-2.5V10h-1v.5a2.5 2.5 0 0 1-2.336 2.495L5 13a2.5 2.5 0 0 1-2.5-2.5V10Zm4-5h-3v5.5a1.5 1.5 0 0 0 1.215 1.473l.14.02L5 12a1.5 1.5 0 0 0 1.5-1.5V5Zm6 0h-3v5.5a1.5 1.5 0 0 0 1.215 1.473l.14.02L11 12a1.5 1.5 0 0 0 1.5-1.5V5Zm0-4h-3v3h3V1Zm-6 0h-3v3h3V1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabVials);
export default Memo;
