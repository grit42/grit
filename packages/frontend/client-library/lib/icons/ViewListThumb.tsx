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

const SvgViewListThumb = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.36 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm-.01.94H1.41a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM12.5 10a.5.5 0 0 1 .09.992L12.5 11h-5a.5.5 0 0 1-.09-.992L7.5 10h5Zm-8 0a.5.5 0 0 1 .09.992L4.5 11h-1a.5.5 0 0 1-.09-.992L3.5 10h1Zm8-2.5a.5.5 0 0 1 .09.992l-.09.008h-5a.5.5 0 0 1-.09-.992L7.5 7.5h5Zm-8 0a.5.5 0 0 1 .09.992L4.5 8.5h-1a.5.5 0 0 1-.09-.992L3.5 7.5h1Zm8-2.5a.5.5 0 0 1 .09.992L12.5 6h-5a.5.5 0 0 1-.09-.992L7.5 5h5Zm-8 0a.5.5 0 0 1 .09.992L4.5 6h-1a.5.5 0 0 1-.09-.992L3.5 5h1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgViewListThumb);
export default Memo;
