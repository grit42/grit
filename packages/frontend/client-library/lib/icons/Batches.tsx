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

const SvgBatches = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M7.299.17c.44-.227.962-.227 1.403 0l6.816 3.525c.296.162.482.47.482.807a.91.91 0 0 1-.492.809l-1.82.939 1.82.941a.91.91 0 0 1 .096 1.56l-.096.058-1.822.941 1.822.943a.91.91 0 0 1 .096 1.56l-.096.058L8.7 15.828a1.529 1.529 0 0 1-1.253.067l-.15-.068-6.806-3.52a.91.91 0 0 1-.096-1.56l.097-.058 1.818-.94-1.819-.94a.91.91 0 0 1-.096-1.56l.096-.058 1.821-.943-1.82-.941a.91.91 0 0 1-.486-.697L0 4.498c0-.34.19-.652.492-.809Zm5.3 10.142L8.701 12.33a1.529 1.529 0 0 1-1.253.067l-.15-.068L3.4 10.312l-2.295 1.186 6.652 3.441a.529.529 0 0 0 .391.038l.094-.038 6.652-3.438-2.295-1.189Zm-9.197-3.5L1.105 8l6.652 3.441a.529.529 0 0 0 .391.038l.094-.038L14.894 8l-2.295-1.187-3.898 2.015a1.529 1.529 0 0 1-1.253.067l-.15-.068-3.896-2.015Zm4.84-5.753a.529.529 0 0 0-.484 0L1.105 4.498l6.652 3.441a.529.529 0 0 0 .391.038l.094-.038 6.656-3.44Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgBatches);
export default Memo;
