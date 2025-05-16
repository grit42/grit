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

const SvgCsvFormat = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M7.002 10.26c.406 0 .724.068.955.203.231.135.395.327.49.574.096.247.144.534.144.861v.476h-1.12v-.532l-.005-.19-.016-.177a.51.51 0 0 0-.115-.28c-.064-.073-.172-.109-.326-.109-.154 0-.266.037-.336.112a.534.534 0 0 0-.133.29c-.019.12-.028.251-.028.396v2.576l.004.152c.006.097.017.185.035.264.025.12.074.21.146.274.073.063.177.094.312.094.15 0 .255-.036.318-.108a.541.541 0 0 0 .12-.291c.016-.121.024-.25.024-.385v-.553h1.12v.469l-.006.194a2.39 2.39 0 0 1-.134.684 1.182 1.182 0 0 1-.483.603c-.229.146-.55.22-.966.22-.42 0-.752-.08-.997-.238a1.255 1.255 0 0 1-.515-.662 2.998 2.998 0 0 1-.147-.983v-2.037l.006-.229a2.85 2.85 0 0 1 .141-.783c.098-.282.27-.5.514-.654.246-.154.578-.231.998-.231Zm3.701 0c.285 0 .518.047.7.14.182.093.324.218.424.374.1.157.17.327.21.512.04.184.064.367.073.549l-.987.147-.01-.166a3.847 3.847 0 0 0-.035-.289.622.622 0 0 0-.126-.308c-.063-.075-.158-.112-.284-.112-.135 0-.235.05-.3.15a.597.597 0 0 0-.099.333c0 .2.046.365.137.494.091.128.216.262.374.402l.574.504.173.16c.165.164.312.346.44.543.17.264.255.59.255.977 0 .266-.06.506-.182.721-.12.215-.29.383-.507.504a1.546 1.546 0 0 1-.767.182c-.35 0-.641-.064-.875-.193a1.224 1.224 0 0 1-.528-.58c-.119-.26-.188-.59-.207-.991l.994-.168.01.168c.013.16.034.3.064.416.04.157.1.274.182.35a.427.427 0 0 0 .304.116c.15 0 .251-.047.305-.14.054-.093.08-.2.08-.322 0-.238-.057-.438-.171-.599a2.855 2.855 0 0 0-.452-.486l-.588-.511-.15-.137a2.32 2.32 0 0 1-.364-.465c-.133-.224-.2-.5-.2-.826 0-.467.137-.825.41-1.075.273-.25.647-.374 1.123-.374ZM8.587.003c.348 0 .683.12.95.34l.11.099 3.915 3.914a1.5 1.5 0 0 1 .431.912l.008.149v3.086a.5.5 0 0 1-.992.09L13 8.503v-2.5H9.5a1.5 1.5 0 0 1-1.493-1.356L8 4.503v-3.5H1.5a.5.5 0 0 0-.492.41L1 1.503v13a.5.5 0 0 0 .41.492l.09.008h2a.5.5 0 0 1 .09.992l-.09.008h-2a1.5 1.5 0 0 1-1.493-1.356L0 14.503v-13A1.5 1.5 0 0 1 1.356.01l.145-.007h7.086Zm4.932 10.327.672 3.92.63-3.92h1.043L14.786 16h-1.19l-1.078-5.67h1.001ZM9.001 1.21v3.293a.5.5 0 0 0 .41.492l.09.008h3.293L9 1.21Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgCsvFormat);
export default Memo;
