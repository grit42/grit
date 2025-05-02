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

const SvgFiht = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.46 11.5a.5.5 0 0 1 .5.5h.006v2.5a1.5 1.5 0 0 1-1.355 1.493l-.144.007h-11a1.5 1.5 0 0 1-1.493-1.356L.967 14.5l-.001-2.432-.006-.067a.5.5 0 0 1 .41-.492l.09-.008a.5.5 0 0 1 .5.5L1.966 12v2.5a.5.5 0 0 0 .41.492l.09.008h11a.5.5 0 0 0 .493-.41l.008-.09-.001-2.432-.006-.067a.5.5 0 0 1 .41-.492ZM6.006 7a.75.75 0 0 1 .617.392l.046.101 1.378 3.793 1.284-2.888a.75.75 0 0 1 .562-.434l.107-.01a.75.75 0 0 1 .632.322l.055.093.623 1.248 4.19.001a.5.5 0 0 1 .492.41l.008.09a.5.5 0 0 1-.41.492l-.09.008h-4.343a.75.75 0 0 1-.617-.324l-.054-.09-.457-.915-1.314 2.958a.75.75 0 0 1-.614.454L8 12.704a.75.75 0 0 1-.642-.405l-.039-.092L5.927 8.38l-.911 1.824a.75.75 0 0 1-.566.406l-.105.007H.5a.5.5 0 0 1-.09-.992l.09-.008h3.691l1.102-2.203a.75.75 0 0 1 .602-.412L6.006 7Zm4.765-7a1 1 0 0 1 .95 1.316L11.494 2h1.974a1.5 1.5 0 0 1 1.493 1.356l.007.144-.001 4.5a.51.51 0 0 1-.506.5.5.5 0 0 1-.496-.567l.003-4.433a.5.5 0 0 0-.41-.492L13.467 3h-2.308l-.104.316a1 1 0 0 1-.833.677L10.106 4H5.827a1 1 0 0 1-.949-.684L4.773 3H2.467a.5.5 0 0 0-.492.41l-.008.09L1.966 8a.51.51 0 0 1-.506.5.5.5 0 0 1-.496-.567L.967 3.5a1.5 1.5 0 0 1 1.355-1.493L2.467 2h1.972l-.227-.683a1 1 0 0 1 .073-.801l.064-.101A.999.999 0 0 1 5.161 0Zm.002 1H5.16l.667 2h4.28l.666-2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgFiht);
export default Memo;
