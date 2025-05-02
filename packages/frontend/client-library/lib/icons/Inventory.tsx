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

const SvgInventory = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M8.805 0a1 1 0 0 1 .95 1.316L9.527 2h.973a1.5 1.5 0 0 1 1.356.857.608.608 0 0 1 .037.204.5.5 0 0 1-.903.296l-.01.005-.018-.049a.488.488 0 0 0-.372-.305L10.5 3H9.193l-.105.316a1 1 0 0 1-.833.677L8.14 4H3.86a1 1 0 0 1-.948-.684L2.806 3H1.5a.5.5 0 0 0-.492.41L1 3.5v11a.5.5 0 0 0 .41.492L1.5 15h9a.5.5 0 0 0 .492-.41L11 14.5v-1.421l-.007-.078a.5.5 0 0 1 .41-.492l.09-.008a.5.5 0 0 1 .5.5L12 13v1.5a1.5 1.5 0 0 1-1.356 1.493L10.5 16h-9a1.5 1.5 0 0 1-1.493-1.356L0 14.5v-11a1.5 1.5 0 0 1 1.356-1.493L1.5 2h.973l-.228-.683a1 1 0 0 1 .073-.801l.064-.101A.999.999 0 0 1 3.194 0Zm3.78 4.086a2 2 0 0 1 2.83 2.829L9.05 13.279a.5.5 0 0 1-.283.141l-2.474.354a.5.5 0 0 1-.566-.566l.353-2.475a.5.5 0 0 1 .142-.283Zm2.122.708a1 1 0 0 0-1.414 0l-6.247 6.245-.236 1.65 1.651-.236 6.246-6.245a1 1 0 0 0 .083-1.32ZM8.807 1H3.194l.666 2h4.28l.667-2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgInventory);
export default Memo;
