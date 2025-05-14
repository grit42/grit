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

const SvgMaths = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M9.711 1c1.38 0 1.851 1.374 1.907 2.1a.596.596 0 0 1-1.189.095c-.004-.046-.097-1.002-.717-1.002-.67 0-1.103 1.477-1.287 2.108l-.05.17c-.046.151-.16.596-.317 1.22h1.455a.596.596 0 1 1 0 1.192H7.762a1398.204 1398.204 0 0 0-1.573 6.45c-.178.601-.783 1.62-1.923 1.62-1.327 0-2.034-1.22-2.242-1.941a.596.596 0 0 1 1.145-.332l.019.055c.08.22.416 1.025 1.078 1.025.5 0 .745-.664.777-.758.087-.36.878-3.636 1.49-6.119h-1.79a.596.596 0 1 1 0-1.192h2.086c.196-.785.346-1.372.403-1.563l.048-.162C7.562 3.003 8.15 1 9.711 1Zm3.314 7.314c.37 0 .656.259.656.61 0 .194-.083.342-.194.48l-1.201 1.405 1.238 1.423c.157.185.23.351.23.536a.626.626 0 0 1-.646.647c-.277 0-.471-.13-.657-.36l-.997-1.313-.998 1.312c-.166.204-.36.36-.61.36-.37 0-.656-.258-.656-.61 0-.193.074-.341.194-.48l1.266-1.496-1.155-1.331c-.157-.185-.23-.351-.23-.536 0-.397.295-.647.646-.647.277 0 .471.13.656.36l.915 1.22.933-1.22c.166-.203.36-.36.61-.36Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgMaths);
export default Memo;
