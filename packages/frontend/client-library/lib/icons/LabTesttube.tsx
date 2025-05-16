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

const SvgLabTesttube = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M11.5 0a.5.5 0 0 1 .09.992L11.5 1h-1v12a3 3 0 0 1-2.824 2.995L7.5 16a3 3 0 0 1-3-3V1h-1a.5.5 0 0 1-.09-.992L3.5 0h8Zm-2 4h-4v9a2 2 0 0 0 1.697 1.977l.154.018L7.5 15a2 2 0 0 0 2-2V4ZM2 7a.5.5 0 0 1 .492.41l.008.09V8H3a.5.5 0 0 1 .09.992L3 9h-.5v.5a.5.5 0 0 1-.992.09L1.5 9.5V9H1a.5.5 0 0 1-.09-.992L1 8h.5v-.5A.5.5 0 0 1 2 7Zm12-5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1ZM9.5 1h-4v2h4V1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabTesttube);
export default Memo;
