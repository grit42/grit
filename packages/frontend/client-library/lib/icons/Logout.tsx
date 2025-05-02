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

const SvgLogout = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M6.79.024A1 1 0 0 1 8 1.003v14a1 1 0 0 1-1.142.99l-6-.858a1 1 0 0 1-.859-.99V2.484c0-.472.33-.88.776-.975Zm6.71 11.979a.5.5 0 0 1 .491.41l.008.09v1a1.5 1.5 0 0 1-1.355 1.493l-.145.007h-3a.5.5 0 0 1-.09-.992l.09-.008h3a.5.5 0 0 0 .492-.41l.008-.09v-1a.5.5 0 0 1 .5-.5Zm-6.5-11-6 1.48v11.662l6 .857v-14Zm6.784 5.088.069.057 1.995 1.995a.51.51 0 0 1 .15.31l.001.018a.408.408 0 0 1-.01.135.355.355 0 0 1-.01.04l-.011.031a.334.334 0 0 1-.019.044l-.017.032a.562.562 0 0 1-.073.098l-2.005 2.005a.5.5 0 0 1-.765-.638l.057-.07 1.147-1.147L10 9.002a.5.5 0 0 1-.09-.992l.09-.008 4.292-.001-1.145-1.145a.5.5 0 0 1-.058-.638l.058-.07a.5.5 0 0 1 .638-.057ZM5.248 7.25a.75.75 0 0 1 .751.745.75.75 0 1 1-.862-.734l.111-.011Zm7.251-5.247a1.5 1.5 0 0 1 1.493 1.355l.007.145v1a.5.5 0 0 1-.992.09L13 4.503v-1a.5.5 0 0 0-.41-.492l-.09-.008h-3a.5.5 0 0 1-.09-.992l.09-.008h3Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLogout);
export default Memo;
