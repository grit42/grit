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

const SvgViewCurve = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.36 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm-.01.94H1.41a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48Zm-4.722 9.92-.02.018a.499.499 0 0 1-.041.032l-.01.006a.507.507 0 0 1-.4.069.52.52 0 0 1-.138-.058l.064.033a.503.503 0 0 1-.148-.098l-.014-.014-.02-.02a.499.499 0 0 1-.03-.041l-.007-.01-1.473-2.209-1.647 4.118-.017.038a.499.499 0 0 1-.018.034l.035-.072a.5.5 0 0 1-.422.312L5.5 13h-2a.5.5 0 0 1-.09-.992L3.5 12h1.661l1.875-4.686.006-.015a.5.5 0 0 1 .022-.044l-.028.06a.502.502 0 0 1 .187-.231l-.054.041a.5.5 0 0 1 .038-.03l.016-.011a.508.508 0 0 1 .35-.079.46.46 0 0 1 .113.03l.015.007a.5.5 0 0 1 .044.022l-.06-.028a.502.502 0 0 1 .231.187l-.041-.054a.5.5 0 0 1 .03.037l.011.017 1.488 2.231 2.636-6.151a.5.5 0 0 1 .948.308l-.028.086-3 7a.517.517 0 0 1-.033.064l.033-.064a.503.503 0 0 1-.098.148l-.014.014Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgViewCurve);
export default Memo;
