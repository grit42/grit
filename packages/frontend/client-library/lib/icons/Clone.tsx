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

const SvgClone = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.56 3.5a1.46 1.46 0 0 1 1.453 1.32l.007.14v9.6a1.46 1.46 0 0 1-1.32 1.453l-.14.007h-9.6a1.46 1.46 0 0 1-1.46-1.46.5.5 0 0 1 .992-.09l.008.09a.46.46 0 0 0 .377.453l.083.007h9.6a.46.46 0 0 0 .453-.377l.007-.083v-9.6a.46.46 0 0 0-.377-.453L14.56 4.5a.5.5 0 1 1 0-1ZM10.5-.02a2 2 0 0 1 2 2v8.52a2 2 0 0 1-2 2H1.98a2 2 0 0 1-2-2V1.98a2 2 0 0 1 2-2Zm0 1H1.98a1 1 0 0 0-1 1v8.52a1 1 0 0 0 1 1h8.52a1 1 0 0 0 1-1V1.98a1 1 0 0 0-1-1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgClone);
export default Memo;
