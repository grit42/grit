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

const SvgPreview = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 10"
    role="img"
    {...props}
  >
    <path d="M8 0h.27c2.51.07 5.26 1.66 7.32 3.92.55.61.55 1.54 0 2.15-2.12 2.34-4.99 3.97-7.58 3.92C5.4 10.03 2.54 8.4.42 6.07c-.55-.61-.55-1.54 0-2.15C2.54 1.58 5.42-.04 8 0Zm0 1h-.02C5.73.96 3.09 2.45 1.15 4.59a.6.6 0 0 0 0 .81C3.1 7.54 5.71 9.03 8 8.99c2.27.04 4.89-1.45 6.84-3.59a.6.6 0 0 0 0-.81C12.89 2.44 10.25.96 8 1Zm0 1h.2A3.015 3.015 0 0 1 11 5c0 1.66-1.34 3-3 3S5 6.66 5 5s1.34-3 3-3Zm0 1h-.15C6.82 3.08 6 3.95 6 5a2 2 0 1 0 4 0c0-.53-.21-1.04-.59-1.41C9.03 3.21 8.53 3 8 3Z" />
  </svg>
);

const Memo = memo(SvgPreview);
export default Memo;
