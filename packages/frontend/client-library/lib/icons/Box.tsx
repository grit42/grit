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

const SvgBox = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path d="M11.992 24a.496.496 0 0 1-.231-.057l-11.492-6A.5.5 0 0 1 0 17.5V6.25a.5.5 0 0 1 .723-.447l11.492 5.75a.5.5 0 0 1 .276.447v11.5a.5.5 0 0 1-.499.5zM1 17.197l10.492 5.478V12.309L1 7.059z" />
    <path d="M12.008 24a.499.499 0 0 1-.5-.5V12a.5.5 0 0 1 .276-.447l11.492-5.75A.5.5 0 0 1 24 6.25V17.5a.5.5 0 0 1-.269.443l-11.492 6a.496.496 0 0 1-.231.057zm.5-11.691v10.366L23 17.197V7.059zM23.5 17.5h.01z" />
    <path d="M.5 6.75a.5.5 0 0 1-.224-.947L11.784.053a.502.502 0 0 1 .447 0l11.492 5.75a.5.5 0 0 1-.447.895L12.008 1.059.724 6.697A.498.498 0 0 1 .5 6.75z" />
    <path d="M18 15a.5.5 0 0 1-.5-.5V9.309L6.284 3.697a.5.5 0 1 1 .448-.895l11.492 5.75A.503.503 0 0 1 18.5 9v5.5a.5.5 0 0 1-.5.5z" />
  </svg>
);

const Memo = memo(SvgBox);
export default Memo;
