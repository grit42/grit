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

const SvgDesktop = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M13.25 1A2.75 2.75 0 0 1 16 3.75v5.5A2.75 2.75 0 0 1 13.25 12h-2.66l.333 2H12a.5.5 0 0 1 .09.992L12 15H4a.5.5 0 0 1-.09-.992L4 14h1.076l.333-2H2.75A2.75 2.75 0 0 1 .005 9.418L0 9.25v-5.5A2.75 2.75 0 0 1 2.75 1ZM9.576 12H6.423l-.333 2h3.819l-.333-2ZM13.25 2H2.75A1.75 1.75 0 0 0 1 3.75v5.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 9.25v-5.5A1.75 1.75 0 0 0 13.25 2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDesktop);
export default Memo;
