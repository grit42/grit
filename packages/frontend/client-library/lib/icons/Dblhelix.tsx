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

const SvgDblhelix = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M10.045.23a.5.5 0 0 1 .058.638l-.057.07 4.95 4.95a.5.5 0 0 1 .765.637l-.058.07-1.771 1.77A4.5 4.5 0 0 1 9.37 9.433c.273.826.298 1.717.077 2.557l-.006.02a4.47 4.47 0 0 1-1.003 1.841l-.16.168-1.408 1.409a.51.51 0 0 1-.006.006l-.006.004-.348.349-.069.058-.076.043a.498.498 0 0 1-.081.03l-.085.014h-.085a.498.498 0 0 1-.242-.087l-.069-.058a.5.5 0 0 1-.058-.638l.058-.07-4.95-4.949a.498.498 0 0 1-.226.13l-.084.015H.458a.498.498 0 0 1-.37-.782l.058-.07.35-.35A.51.51 0 0 1 .5 9.07l.004-.004 1.41-1.41A4.5 4.5 0 0 1 6.5 6.561a4.504 4.504 0 0 1-.11-2.41.478.478 0 0 1 .043-.214l.021-.038c.182-.624.501-1.218.958-1.732l.158-.168L9.338.23a.5.5 0 0 1 .707 0ZM2.267 8.715l-.707.708 4.949 4.948.707-.707-4.949-4.949Zm.736-.679 4.893 4.893c.211-.288.373-.601.485-.927l-2.578-2.58a.5.5 0 0 1 .638-.764l.07.058 2.06 2.06a3.5 3.5 0 0 0-5.568-2.74Zm4.464-4.02 2.579 2.578a.5.5 0 0 1-.638.765l-.07-.057-2.061-2.06a3.5 3.5 0 0 0 5.568 2.74L7.953 3.087a3.476 3.476 0 0 0-.486.927Zm1.872-2.372-.708.708 4.95 4.949.707-.707-4.949-4.95Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDblhelix);
export default Memo;
