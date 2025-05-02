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

const SvgTools = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M8.298 2.868c0-1.234.777-2.334 1.94-2.747a.45.45 0 0 1 .6.424v1.091a.371.371 0 0 0 .743 0L11.579.544a.45.45 0 0 1 .6-.424 2.915 2.915 0 0 1 .373 5.333l-.074.035v5.03l.075.034a2.915 2.915 0 0 1 1.56 2.38l.007.204a2.915 2.915 0 0 1-1.938 2.748.45.45 0 0 1-.601-.425v-1.09a.371.371 0 1 0-.742 0v1.092a.45.45 0 0 1-.6.424 2.915 2.915 0 0 1-.373-5.333l.072-.035.001-5.03-.073-.034a2.915 2.915 0 0 1-1.56-2.38Zm1.536-1.47a2.014 2.014 0 0 0 .706 3.368c.18.064.3.233.3.424l-.001 5.623c0 .19-.12.36-.3.424a2.015 2.015 0 0 0-.706 3.37l.105.091.001-.33c0-.655.496-1.194 1.133-1.263l.139-.008c.702 0 1.27.57 1.27 1.272v.325l.104-.09c.357-.335.586-.796.628-1.3l.007-.168c0-.853-.537-1.613-1.34-1.898a.45.45 0 0 1-.3-.425V5.19c-.001-.191.12-.361.299-.425a2.015 2.015 0 0 0 .706-3.369l-.105-.09v.33c0 .655-.495 1.195-1.132 1.264l-.139.007c-.702 0-1.27-.569-1.27-1.27l-.001-.33ZM2.487.415c.241-.295.603-.466.984-.466h.975a1.273 1.273 0 0 1 1.248 1.523l-.303 1.517c-.105.53-.49.945-.983 1.105v3.92l.332.001c.634 0 1.157.48 1.224 1.097l.007.134v4.695a2.012 2.012 0 0 1-4.025-.007V9.246a1.231 1.231 0 0 1 1.232-1.232h.33V4.093a1.462 1.462 0 0 1-.946-.961l-.036-.144-.303-1.517A1.273 1.273 0 0 1 2.487.414Zm.456 8.597a.331.331 0 0 0-.097.234v4.68a1.113 1.113 0 0 0 2.225.008V9.245a.331.331 0 0 0-.331-.331H3.177a.331.331 0 0 0-.234.097Zm.24-8.026c-.071.086-.1.2-.078.31l.304 1.517a.56.56 0 0 0 1.1 0l.303-1.518a.373.373 0 0 0-.366-.446h-.975a.373.373 0 0 0-.288.137Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgTools);
export default Memo;
