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

const SvgBladder = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M7.594 1.406a.5.5 0 0 1 .492.41l.008.09v.813c0 .172.14.312.312.312 3.67 0 6.188 2.392 6.188 6.188 0 2.687-2.016 5.375-5.375 5.375-1.697 0-2.821-.33-3.563-.922a3.378 3.378 0 0 1-.352-.34l-.202-.232L5.02 13a.316.316 0 0 0-.169.21l-.008.072v.813a.5.5 0 0 1-.992.09l-.008-.09v-.813c0-.725.587-1.312 1.312-1.312a.67.67 0 0 1 .426.155l.031.03.44.51c.085.094.166.177.228.227.548.438 1.452.703 2.938.703 2.734 0 4.375-2.188 4.375-4.375 0-3.232-2.059-5.188-5.188-5.188-.68 0-1.238-.516-1.305-1.178l-.007-.134v-.813a.5.5 0 0 1 .5-.5Zm-2.438 0a.5.5 0 0 1 .492.41l.008.09v.812A1.94 1.94 0 0 0 7.442 4.65l.152.006h.812a.5.5 0 0 1 .09.992l-.09.008-.53.001c.576 2.443-1.13 4.874-2.7 4.874a2.883 2.883 0 0 0-2.758 2.58l-.012.17v.813a.5.5 0 0 1-.992.09l-.008-.09v-.832a3.888 3.888 0 0 1 3.75-3.73c.266 0 .938-.49 1.364-1.153.531-.827.669-1.793.286-2.83A2.941 2.941 0 0 1 4.66 2.89l-.005-.172v-.813a.5.5 0 0 1 .5-.5Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgBladder);
export default Memo;
