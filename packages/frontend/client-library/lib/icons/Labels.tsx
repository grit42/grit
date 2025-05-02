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

const SvgLabels = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M5.879.207a2.5 2.5 0 0 1 1.767.731l7.708 7.708a1.5 1.5 0 0 1 0 2.12l-4.586 4.588a1.5 1.5 0 0 1-2.122 0L.94 7.645a2.5 2.5 0 0 1-.732-1.767V1.707a1.5 1.5 0 0 1 1.5-1.5Zm0 1H1.707a.5.5 0 0 0-.5.5v4.171c0 .398.158.78.44 1.06l7.707 7.708a.5.5 0 0 0 .706 0l4.586-4.586a.5.5 0 0 0 0-.707L6.94 1.646a1.5 1.5 0 0 0-1.06-.44Zm-1.672 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabels);
export default Memo;
