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

const SvgLessOrEqualThan = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M1.42 0C.64 0 0 .64 0 1.42v13.16C0 15.36.64 16 1.42 16h13.16c.78 0 1.42-.64 1.42-1.42V1.42C16 .64 15.36 0 14.58 0Zm.01.94h13.16c.27 0 .48.22.48.48v13.16c0 .27-.22.48-.48.48H1.43a.48.48 0 0 1-.48-.48V1.42c0-.27.22-.48.48-.48Zm3.645 9.86a.5.5 0 0 0-.09.992l.09.008h5.95a.5.5 0 0 0 .09-.992l-.09-.008h-5.95Zm-.246-4.438a.496.496 0 0 0-.233.597.506.506 0 0 0 .03.07l.006.012a.496.496 0 0 0 .205.201l.04.02 5.983 2.492a.5.5 0 0 0 .464-.882l-.08-.042-4.75-1.979 4.717-1.577.082-.036a.5.5 0 0 0-.4-.912l-5.981 2-.044.017a.503.503 0 0 0-.027.013Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLessOrEqualThan);
export default Memo;
