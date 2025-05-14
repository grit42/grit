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

const Svg100 = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <style>{".100_svg__st0{display:none}.100_svg__st1{display:inline}"}</style>
    <g id="100_svg___x31_00">
      <path d="M8 5.6c-.7 0-1 .8-1 2.4 0 1.9.3 2.5 1 2.5s1-.7 1-2.4c0-1.8-.3-2.5-1-2.5z" />
      <path d="M14.7 3.9 8.2.1C8.1 0 8 0 7.8.1L1.3 3.9c-.1.1-.2.2-.2.3v7.5c0 .1.1.2.2.3l6.5 3.8c.1.1.2.1.4 0l6.5-3.8c.1-.1.2-.2.2-.3V4.2c0-.1-.1-.2-.2-.3zM8 11.8c-1.8 0-3.1-1.1-3.1-3.6 0-2.6 1.5-3.7 3.2-3.7 1.8 0 3.1 1.1 3.1 3.6-.1 2.5-1.5 3.7-3.2 3.7z" />
    </g>
  </svg>
);

const Memo = memo(Svg100);
export default Memo;
