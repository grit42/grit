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

const SvgLicenses = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M7 0a1 1 0 0 1 1 1h6.5a1.5 1.5 0 0 1 1.493 1.355l.007.144v12a1.5 1.5 0 0 1-1.356 1.493L14.5 16h-13a1.5 1.5 0 0 1-1.493-1.355L0 14.499v-12a1.5 1.5 0 0 1 1.356-1.493L1.5 1H3a1 1 0 0 1 1-1ZM2.999 2H1.5a.5.5 0 0 0-.492.41L1 2.5v12a.5.5 0 0 0 .41.491L1.5 15h13a.5.5 0 0 0 .492-.41L15 14.5v-12a.5.5 0 0 0-.41-.492L14.5 2H7.999L8 7.5a.5.5 0 0 1-.727.446L7.2 7.9 5.5 6.625 3.8 7.9a.5.5 0 0 1-.793-.315L3 7.5 2.999 2ZM10.5 12a.5.5 0 0 1 .09.991L10.5 13h-7a.5.5 0 0 1-.09-.992L3.5 12h7Zm2-2a.5.5 0 0 1 .09.991L12.5 11h-9a.5.5 0 0 1-.09-.992L3.5 10h9ZM7 1H4v.487A.51.51 0 0 1 4 1.5l-.001.011V6.5L5.2 5.6a.5.5 0 0 1 .52-.049l.08.049 1.199.899L7 .999Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLicenses);
export default Memo;
