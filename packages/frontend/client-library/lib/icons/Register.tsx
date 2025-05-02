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

const SvgRegister = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M9.807 0a1 1 0 0 1 .95 1.315L10.527 2h1.973a1.5 1.5 0 0 1 1.493 1.356l.007.144V6a.5.5 0 0 1-.992.09L13.001 6V3.5a.5.5 0 0 0-.41-.493L12.501 3h-2.307l-.104.317a1 1 0 0 1-.821.675l-.128.008h-4.28a1 1 0 0 1-.948-.684L3.807 3H1.501a.5.5 0 0 0-.492.41l-.008.09v11a.5.5 0 0 0 .41.492l.09.008H7a.5.5 0 0 1 .09.992L7 16H1.501a1.5 1.5 0 0 1-1.493-1.355l-.007-.145v-11a1.5 1.5 0 0 1 1.356-1.493L1.5 2h1.973l-.227-.683a1 1 0 0 1 .072-.8l.065-.102a.999.999 0 0 1 .811-.415ZM11.5 7a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 1a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm2.083 1.933a.5.5 0 0 1 .147.624l-.047.076-1.937 2.583a1 1 0 0 1-1.415.189l-.093-.082-1-1a.5.5 0 0 1 .638-.765l.07.058 1 .999 1.937-2.582a.5.5 0 0 1 .7-.1ZM9.807 1H4.195l.667 2H9.14l.667-2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgRegister);
export default Memo;
