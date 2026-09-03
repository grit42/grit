/**
 * Copyright 2026 grit42 A/S. <https://grit42.com/>
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

const SvgMenuSquare = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 612 612"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path d="M535.5 0h-459C34.253 0 0 34.253 0 76.5v459C0 577.747 34.253 612 76.5 612h459c42.247 0 76.5-34.253 76.5-76.5v-459C612 34.253 577.747 0 535.5 0Zm38.25 535.5c0 21.133-17.136 38.25-38.25 38.25h-459c-21.133 0-38.25-17.117-38.25-38.25v-459c0-21.133 17.117-38.25 38.25-38.25h459c21.114 0 38.25 17.136 38.25 38.25z" />
    <path
      style={{
        strokeWidth: 1.51714,
      }}
      d="M190.23 286.982v.008a19.087 19.087 0 0 0-18.677 19.084 19.087 19.087 0 0 0 18.677 19.082v.024H421.771v-.008a19.087 19.087 0 0 0 18.676-19.084 19.087 19.087 0 0 0-18.676-19.082v-.024H224.463ZM190.23 171.864v.008a19.087 19.087 0 0 0-18.677 19.084 19.087 19.087 0 0 0 18.677 19.082v.024H421.771v-.008a19.087 19.087 0 0 0 18.676-19.084 19.087 19.087 0 0 0-18.676-19.082v-.024H224.463ZM190.23 402.1v.009a19.087 19.087 0 0 0-18.677 19.084 19.087 19.087 0 0 0 18.677 19.082v.023H421.771v-.008a19.087 19.087 0 0 0 18.676-19.084 19.087 19.087 0 0 0-18.676-19.082v-.023H224.463Z"
    />
  </svg>
);

const Memo = memo(SvgMenuSquare);
export default Memo;
