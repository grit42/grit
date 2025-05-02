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

const SvgEdit = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m13.062 0 .212.006c.704.046 1.37.346 1.874.848a2.926 2.926 0 0 1-.024 4.152l-9.667 9.667a.5.5 0 0 1-.23.13L.625 15.985a.5.5 0 0 1-.608-.608l1.18-4.604a.5.5 0 0 1 .131-.229L10.99.881A2.926 2.926 0 0 1 13.062 0ZM1.947 11.869l-.753 2.936 2.939-.754-2.186-2.182Zm7.728-8.26-7.287 7.287 2.718 2.712 7.284-7.283L9.675 3.61Zm1.396-1.395-.69.689 2.716 2.715.689-.69-2.715-2.714ZM13.069 1l-.17.009a1.931 1.931 0 0 0-1.198.575l.079-.075 2.713 2.712c.245-.268.41-.598.475-.952l.023-.168.01-.17a1.925 1.925 0 0 0-.56-1.37A1.926 1.926 0 0 0 13.069 1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgEdit);
export default Memo;
