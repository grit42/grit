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

const SvgLabBottle = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M13.5 2h1a.5.5 0 0 1 .09.992L14.5 3H14v11a2.001 2.001 0 0 1-2.666 1.886.5.5 0 0 1 .245-.965l.087.022a1.001 1.001 0 0 0 1.327-.823L13 14V3h-2v2a.5.5 0 0 1-.41.492l-.09.008a.5.5 0 0 1-.492-.41L10 5V3h-.5a.5.5 0 0 1-.09-.992L9.5 2h4Zm-5-2a.5.5 0 0 1 .09.992L8.5 1H8v4.207l.261.081a5.501 5.501 0 0 1 3.73 5.537l-.019.227a5.55 5.55 0 0 1-.077.52l.005-.072a.501.501 0 0 1-.015.12 5.502 5.502 0 0 1-10.857-.568 5.5 5.5 0 0 1 3.931-5.833L5 5.207V1H4.5a.5.5 0 0 1-.09-.992L4.5 0h4Zm2.243 12.001H2.257a4.501 4.501 0 0 0 8.486 0ZM7 1H5.999L6 5.6a.5.5 0 0 1-.24.427l-.076.038-.084.025A4.5 4.5 0 0 0 2.028 11h8.943l.006-.049A4.5 4.5 0 0 0 7.61 6.138L7.4 6.09A.5.5 0 0 1 7 5.6V1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabBottle);
export default Memo;
