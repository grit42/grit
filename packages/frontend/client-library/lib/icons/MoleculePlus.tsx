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

const SvgMoleculePlus = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <g fillRule="evenodd">
      <path
        d="M7.816.008a.5.5 0 0 0-.35.742l.76 1.316-1.425 2.47H4.074l-.74-1.286-.053-.074a.5.5 0 0 0-.814.574l.76 1.316-1.473 2.551H.5l-.09.008a.502.502 0 0 0 .09.992h1.389l1.304 2.26-.726 1.258a.5.5 0 0 0 .814.574l.053-.074.676-1.17h1.733c.295 0 .5-.264.5-.5s-.197-.5-.5-.5l-1.632-.002L2.688 8 4.11 5.536h2.73c.284.49.072.24.74 1.396.147.256.55.31.799.139s.27-.53.117-.793c-.781-1.332-.4-.765-.753-1.377l1.367-2.365h2.844L13.38 5s.523-1.016-.464.693c-.15.26-.083.608.193.732.277.124.552.01.7-.248.224-.386.37-.56.37-.56h1.36l.085-.008a.496.496 0 0 0 .395-.492.49.49 0 0 0-.48-.5h-1.226l-1.457-2.521.778-1.346a.5.5 0 0 0-.815-.574l-.05.074-.745 1.285H9.074L8.334.25 8.281.176a.5.5 0 0 0-.465-.168z"
        fillRule="nonzero"
      />
      <path d="M11.432 7A4.5 4.5 0 0 0 7 11.5a4.5 4.5 0 0 0 4.5 4.5 4.5 4.5 0 0 0 4.5-4.5A4.5 4.5 0 0 0 11.5 7a4.5 4.5 0 0 0-.068 0zm.01 1a3.5 3.5 0 0 1 .058 0 3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8 11.5 3.5 3.5 0 0 1 11.442 8z" />
      <path d="M11.5 8.75a.5.604 0 0 0-.5.604V11H9.355a.604.5 0 0 0-.605.5.604.5 0 0 0 .605.5H11v1.647a.5.604 0 0 0 .5.603.5.604 0 0 0 .5-.603V12h1.647a.604.5 0 0 0 .603-.5.604.5 0 0 0-.604-.5H12V9.354a.5.604 0 0 0-.5-.604z" />
    </g>
  </svg>
);

const Memo = memo(SvgMoleculePlus);
export default Memo;
