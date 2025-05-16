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

const SvgNoPreview = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 15.99 9.99"
    role="img"
    {...props}
  >
    <path d="M7.99 0h.27c2.51.07 5.26 1.66 7.32 3.92.55.61.55 1.54 0 2.15-2.12 2.34-4.99 3.97-7.58 3.92-2.61.04-5.47-1.59-7.59-3.92-.55-.61-.55-1.54 0-2.15C2.53 1.58 5.41-.04 7.99 0Zm0 1h-.02C5.72.96 3.08 2.45 1.14 4.59a.6.6 0 0 0 0 .81C3.09 7.54 5.7 9.03 7.99 8.99c2.27.04 4.89-1.45 6.84-3.59a.6.6 0 0 0 0-.81C12.88 2.44 10.24.96 7.99 1Zm0 1h.2a3.015 3.015 0 0 1 2.8 3c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3Zm0 1h-.15c-1.03.08-1.85.95-1.85 2s.9 2 2 2 2-.89 2-2c0-.53-.21-1.04-.59-1.41C9.02 3.21 8.52 3 7.99 3Z" />
    <path d="m.45 8.78.51.87 14.57-8.44-.49-.85L.45 8.78z" />
  </svg>
);

const Memo = memo(SvgNoPreview);
export default Memo;
