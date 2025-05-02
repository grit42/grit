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

const SvgMouse = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M11.719 1.23c.87.251 1.52.963 1.712 1.82l.033.182 2.152.864a.5.5 0 0 1 .314.45l-.005.085a4.21 4.21 0 0 1-1.676 2.784c-.525.352-1.209.556-2.015.645l-.153.013.289.867h.13a.5.5 0 0 1 .492.41l.008.09a.5.5 0 0 1-.41.492l-.09.008h-.49a.5.5 0 0 1-.438-.259l-.036-.083-.497-1.486a12.118 12.118 0 0 1-1.03-.063l-.251-.029-.023-.003a2.442 2.442 0 0 1-.487.923h.812a.5.5 0 0 1 .09.992l-.09.008H7.13a3.909 3.909 0 0 1-3.778-2.9c-.71.11-1.344.538-1.711 1.174a2.445 2.445 0 0 0-.017 2.428 2.435 2.435 0 0 0 1.923 1.22l.173.008h6.83c2.557 0 2.615 3.285.174 3.435l-.174.005H7.62a.5.5 0 0 1-.09-.992l.09-.008h2.93c1.237 0 1.282-1.339.133-1.435l-.133-.005H3.715a3.44 3.44 0 0 1-2.961-1.736A3.445 3.445 0 0 1 .777 7.71 3.406 3.406 0 0 1 3.22 6.047V6.03c0-2.163 1.75-3.91 3.91-3.91.701 0 1.267.103 1.709.281l.043.018a2.461 2.461 0 0 1 2.837-1.19ZM9.812 2.808a1.455 1.455 0 0 0 .134 1.742.5.5 0 1 1-.752.66 2.452 2.452 0 0 1-.601-1.823l-.127-.058c-.32-.129-.76-.209-1.336-.209-1.608 0-2.91 1.3-2.91 2.91 0 1.608 1.3 2.91 2.91 2.91.992 0 1.634-.798 1.68-1.29a.463.463 0 0 1-.048-.25.194.194 0 0 0-.036-.046.5.5 0 1 1 .708-.708c.105.106.186.224.244.351l.117.02.317.037a9.648 9.648 0 0 0 2.011.012c.661-.073 1.199-.233 1.548-.467a3.214 3.214 0 0 0 1.177-1.698l.007-.034-2.051-.823a.5.5 0 0 1-.307-.378l-.007-.086a1.46 1.46 0 0 0-1.049-1.39 1.46 1.46 0 0 0-1.629.618ZM11.51 5.3v-.01c0-.406.334-.74.74-.74a.5.5 0 0 1 .157.025A.744.744 0 0 1 13 5.3a.499.499 0 0 1-.033.18.742.742 0 0 1-.717.56.743.743 0 0 1-.74-.74Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgMouse);
export default Memo;
