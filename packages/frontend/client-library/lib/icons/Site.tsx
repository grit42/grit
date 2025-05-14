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

const SvgSite = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.36 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm-.01.94H1.41a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM8.01 3.2c2.152 0 3.899 1.75 3.91 3.91 0 1.089-.505 2.31-1.356 3.608a16.095 16.095 0 0 1-1.62 2.075l-.163.168c-.23.22-.446.329-.771.329-.368 0-.598-.139-.856-.414l-.268-.292c-.45-.505-.96-1.148-1.43-1.866C4.605 9.42 4.1 8.198 4.1 7.11A3.914 3.914 0 0 1 8.01 3.2Zm0 1A2.914 2.914 0 0 0 5.1 7.11c0 .85.438 1.91 1.192 3.06.285.435.6.86.927 1.26l.258.31.228.259.222.24.05.043c.011.007.02.008.033.008.028 0 .043-.01.143-.115L8.314 12l.229-.26.258-.31c.327-.4.642-.825.927-1.26.754-1.15 1.192-2.21 1.192-3.057A2.92 2.92 0 0 0 8.01 4.2ZM8 6.5c.469 0 .85.385.85.85 0 .474-.381.85-.85.85a.853.853 0 0 1-.85-.85c0-.465.381-.85.85-.85Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgSite);
export default Memo;
