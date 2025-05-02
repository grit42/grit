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

const SvgRabbit = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m8.198 1.897.425.2.459.227.493.255.528.284 2.177 1.184.368.209.315.189.142.089.26.174c1.089.758 1.545 1.56 1.545 2.848 0 1.27-.842 2.369-2.032 2.778l-.137.043.009.052c.008.067.015.135.019.203l.006.206c0 1.126-.375 2.102-1.03 2.78h.101a.5.5 0 0 1 .09.993l-.09.008H9.283l-.046-.002-.028-.005-.016-.001-.008-.002-3.236.002a.499.499 0 0 1-.176 0l-.752-.001c-2.093 0-3.81-1.585-3.916-3.586l-.005-.195c0-2.027 1.652-3.676 3.72-3.777l.201-.005 3.815.001.023-.124c.06-.271.158-.532.293-.774l.076-.128-1.867-.893c-1.958-.934-2.898-1.924-2.42-3.021l.058-.122c.477-.906 1.357-.924 3.199-.09Zm-2.314.555c-.177.336.167.811 1.154 1.381l.353.193.194.1.207.1 2.433 1.164a.5.5 0 0 1 .134.808c-.325.319-.52.736-.56 1.181l-.006.127.002.011a.502.502 0 0 1-.507.574l-.08-.008-.077-.012-.26-.024h-3.85c-1.618 0-2.921 1.25-2.921 2.782 0 1.476 1.212 2.691 2.75 2.776l.171.005h.524c.47-1.208-.17-2.272-1.39-2.272a.5.5 0 1 1 0-1c1.836 0 2.886 1.571 2.44 3.271h2.904l.123-.01c1.264-.151 2.083-1.154 2.149-2.574l.004-.188c0-.239-.036-.476-.107-.695a.5.5 0 0 1 .422-.65c1.037-.113 1.82-.953 1.82-1.936 0-.947-.286-1.45-1.116-2.028l-.114-.077-.252-.161-.293-.176-.346-.196-2.391-1.3-.679-.355-.404-.203-.37-.177-.333-.152-.3-.127-.268-.103-.237-.081c-.554-.174-.831-.144-.923.032Zm6.601 4.193c.321 0 .6.213.684.512l.003.015c.02.054.032.113.032.174a.702.702 0 0 1-.575.689.483.483 0 0 1-.144.021.705.705 0 0 1-.71-.701v-.009c0-.395.325-.701.71-.701Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgRabbit);
export default Memo;
