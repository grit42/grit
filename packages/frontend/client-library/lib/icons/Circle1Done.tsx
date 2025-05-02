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

const SvgCircle1Done = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <style>
      {
        ".circle-1done_svg__st0{display:none}.circle-1done_svg__st1{display:inline}"
      }
    </style>
    <g id="circle-1done_svg__circle-border">
      <g id="circle-1done_svg__Icon-Plus_3_" transform="translate(28 278)">
        <path
          id="circle-1done_svg__Fill-38_3_"
          d="M-20-262.9c-3.9 0-7.1-3.2-7.1-7.1s3.2-7.1 7.1-7.1 7.1 3.2 7.1 7.1-3.2 7.1-7.1 7.1zm0-13.4c-3.5 0-6.3 2.8-6.3 6.3s2.8 6.3 6.3 6.3 6.3-2.8 6.3-6.3-2.8-6.3-6.3-6.3z"
        />
      </g>
    </g>
    <path
      d="m11.781 4.924-5 5-2.5-2.5-.6.6 2.5 2.5.6.601 5.6-5.602-.6-.6z"
      fillRule="evenodd"
      id="circle-1done_svg__circle-close"
    />
  </svg>
);

const Memo = memo(SvgCircle1Done);
export default Memo;
