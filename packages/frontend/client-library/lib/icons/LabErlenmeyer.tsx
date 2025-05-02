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

const SvgLabErlenmeyer = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M11.484 0a.5.5 0 0 1 .09.992l-.09.008h-.5v4.352l4.41 6.785a2.5 2.5 0 0 1 .183 2.392l-.081.163A2.5 2.5 0 0 1 13.299 16H2.666a2.5 2.5 0 0 1-2.093-3.862L4.984 5.35V1h-.5a.5.5 0 0 1-.09-.992L4.484 0h7Zm.679 9H3.805l-2.393 3.683a1.5 1.5 0 0 0-.131 1.384l.07.148A1.5 1.5 0 0 0 2.667 15h10.632a1.5 1.5 0 0 0 1.257-2.318L12.163 9ZM9.984 1h-4v4.5a.5.5 0 0 1-.036.187l-.045.085L4.455 8h7.058l-1.448-2.228a.5.5 0 0 1-.072-.176L9.984 5.5V5h-1.5a.5.5 0 0 1-.09-.992L8.484 4h1.5V3h-1.5a.5.5 0 0 1-.09-.992L8.484 2h1.5V1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabErlenmeyer);
export default Memo;
