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

const SvgCalendar = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M11.5 0a.5.5 0 0 1 .492.41L12 .5V2h2a2 2 0 0 1 1.995 1.85L16 4v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2V.5a.5.5 0 0 1 .992-.09L5 .5V2h6V.5a.5.5 0 0 1 .5-.5ZM15 7H1v7a1 1 0 0 0 .883.993L2 15h12a1 1 0 0 0 1-1V7ZM3.75 12l.102.007a.75.75 0 1 1-.204 0L3.75 12ZM8 12l.102.007a.75.75 0 1 1-.204 0L8 12Zm4.25 0 .102.007a.75.75 0 1 1-.204 0L12.25 12Zm-8.5-3.5.102.007a.75.75 0 1 1-.204 0L3.75 8.5ZM8 8.5l.102.007a.75.75 0 1 1-.204 0L8 8.5Zm4.25 0 .102.007a.75.75 0 1 1-.204 0l.102-.007ZM4 3H2a1 1 0 0 0-1 1v2h14V4a1 1 0 0 0-.883-.993L14 3h-2v1a.5.5 0 0 1-.992.09L11 4V3H5v1a.5.5 0 0 1-.992.09L4 4V3Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgCalendar);
export default Memo;
