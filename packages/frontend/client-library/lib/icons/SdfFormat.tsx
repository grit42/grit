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

const SvgSdfFormat = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M6.834 10.26c.285 0 .518.047.7.14.182.093.323.218.423.374.1.157.17.327.21.512.04.184.065.367.074.549l-.987.147-.011-.166a3.847 3.847 0 0 0-.035-.289.622.622 0 0 0-.126-.308c-.063-.075-.157-.112-.283-.112-.135 0-.236.05-.301.15a.597.597 0 0 0-.098.333c0 .2.045.365.136.494.092.128.216.262.375.402l.574.504.172.16c.166.164.313.346.44.543.17.264.256.59.256.977 0 .266-.06.506-.182.721-.121.215-.29.383-.507.504a1.546 1.546 0 0 1-.767.182c-.35 0-.642-.064-.875-.193a1.224 1.224 0 0 1-.529-.58c-.119-.26-.187-.59-.206-.991l.994-.168.01.168c.013.16.034.3.063.416.04.157.1.274.183.35a.427.427 0 0 0 .304.116c.15 0 .25-.047.304-.14.054-.093.081-.2.081-.322 0-.238-.057-.438-.171-.599a2.855 2.855 0 0 0-.452-.486l-.588-.511-.15-.137a2.32 2.32 0 0 1-.365-.465c-.133-.224-.199-.5-.199-.826 0-.467.136-.825.41-1.075.272-.25.647-.374 1.123-.374ZM8.587.003c.348 0 .683.12.95.34l.11.099 3.915 3.914a1.5 1.5 0 0 1 .431.912l.008.149v3.086a.5.5 0 0 1-.992.09L13 8.503v-2.5H9.5a1.5 1.5 0 0 1-1.493-1.356L8 4.503v-3.5H1.5a.5.5 0 0 0-.492.41L1 1.503v13a.5.5 0 0 0 .41.492l.09.008h2a.5.5 0 0 1 .09.992l-.09.008h-2a1.5 1.5 0 0 1-1.493-1.356L0 14.503v-13A1.5 1.5 0 0 1 1.356.01l.145-.007h7.086Zm1.672 10.327.2.004c.385.015.693.075.923.181.269.124.459.318.57.582.113.263.169.6.169 1.011v2.065l-.005.204c-.015.329-.07.606-.163.832-.112.27-.3.47-.564.598-.263.129-.63.193-1.102.193H8.873v-5.67h1.386Zm5.022 0v.784h-1.239v1.533h1.05v.805h-1.05V16h-1.155v-5.67h2.394Zm-5.015.812h-.238v4.053h.245c.215 0 .367-.034.458-.101a.455.455 0 0 0 .172-.301c.023-.133.035-.298.035-.494v-2.338l-.003-.14a1.662 1.662 0 0 0-.043-.332.412.412 0 0 0-.182-.263c-.09-.056-.239-.084-.444-.084ZM9 1.21v3.293a.5.5 0 0 0 .41.492l.09.008h3.293L9 1.21Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgSdfFormat);
export default Memo;
