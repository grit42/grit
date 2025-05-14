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

const SvgAnimalFile = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M11.874 6.599a2.75 2.75 0 0 1 2.985 2.3 1.602 1.602 0 0 1 1.16 1.573.5.5 0 0 1-.412.48l-.088.009h-.626v.744a4.26 4.26 0 0 1-3.82 4.3l-.208.017a4.156 4.156 0 0 1-4.284-4.155.5.5 0 0 1 .5-.5h.563a1.75 1.75 0 0 0 1.75-1.75v-.176A2.815 2.815 0 0 1 11.86 6.6Zm.625-6.596.145.007a1.5 1.5 0 0 1 1.355 1.493V4.66l-.008.09A.5.5 0 0 1 13 4.66V1.503l-.008-.09a.5.5 0 0 0-.492-.41H6v3.5l-.007.144A1.5 1.5 0 0 1 4.5 6.003H1v8.5a.5.5 0 0 0 .41.492l.09.008h3a.5.5 0 0 1 .09.992l-.09.008h-3a1.5 1.5 0 0 1-1.493-1.356L0 14.503V5.417l.008-.149a1.5 1.5 0 0 1 .431-.912L4.353.442l.11-.1a1.5 1.5 0 0 1 .95-.34H12.5Zm-.363 7.583-.164.008-.139.024a1.817 1.817 0 0 0-1.435 1.66l-.004.154v.185a2.75 2.75 0 0 1-2.75 2.75h-.022l.023.13c.112.55.369 1.063.748 1.483l.147.153a3.15 3.15 0 0 0 2.282.89 3.26 3.26 0 0 0 3.072-3.31V9.335a1.75 1.75 0 0 0-1.922-1.742Zm.147 2.25-.012-.001-.086-.007a.64.64 0 0 1-.541-.634l.002-.034.005-.06a.64.64 0 1 1 .635.736h-.003ZM4.999 1.209 1.205 5.003H4.5l.09-.008A.5.5 0 0 0 5 4.503V1.209Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgAnimalFile);
export default Memo;
