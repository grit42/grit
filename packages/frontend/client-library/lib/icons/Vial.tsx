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

const SvgVial = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M12 0a1.5 1.5 0 0 1 1.5 1.5V3a1 1 0 0 1-1 1v10.5A1.5 1.5 0 0 1 11 16H5a1.5 1.5 0 0 1-1.5-1.5V4a1 1 0 0 1-1-1V1.5A1.5 1.5 0 0 1 4 0Zm-.5 4h-7v10.5a.5.5 0 0 0 .41.492L5 15h6a.5.5 0 0 0 .5-.5V13H7a.5.5 0 0 1-.492-.41L6.5 12.5v-5A.5.5 0 0 1 7 7h4.5V4Zm0 4h-4v4h4V8Zm.5-7H4a.5.5 0 0 0-.5.5V3h9V1.5A.5.5 0 0 0 12 1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgVial);
export default Memo;
