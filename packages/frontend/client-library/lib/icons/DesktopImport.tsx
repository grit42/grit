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

const SvgDesktopImport = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M12.91 2.992A.5.5 0 0 1 13 2h.25a2.75 2.75 0 0 1 2.745 2.582L16 4.75v5.5a2.75 2.75 0 0 1-2.582 2.745L13.25 13h-2.66l.333 2H12a.5.5 0 0 1 .09.992L12 16H4a.5.5 0 0 1-.09-.992L4 15h1.076l.333-2H2.75a2.75 2.75 0 0 1-2.745-2.582L0 10.25v-5.5a2.75 2.75 0 0 1 2.582-2.745L2.75 2H3a.5.5 0 0 1 0 1h-.25a1.75 1.75 0 0 0-1.744 1.606L1 4.75v5.5a1.75 1.75 0 0 0 1.606 1.744L2.75 12h10.5a1.75 1.75 0 0 0 1.744-1.606L15 10.25v-5.5a1.75 1.75 0 0 0-1.606-1.744L13.25 3H13ZM9.576 13H6.423l-.333 2h3.819l-.333-2ZM8 0a.5.5 0 0 1 .5.5v4.792l1.146-1.146a.5.5 0 0 1 .765.638l-.057.07-2 2a.51.51 0 0 1-.122.089l-.024.012a.497.497 0 0 1-.034.014l-.018.006-.03.009A.5.5 0 0 1 8 7l.072-.005A.503.503 0 0 1 8.02 7H8a.509.509 0 0 1-.127-.016l-.03-.009a.496.496 0 0 1-.017-.006l-.014-.005a.497.497 0 0 1-.02-.01l-.024-.011a.5.5 0 0 1-.122-.09l.052.045a.503.503 0 0 1-.04-.033l-.012-.011-2-2-.057-.07a.5.5 0 0 1 .765-.638L7.5 5.293V.5l.008-.09A.5.5 0 0 1 8 0Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDesktopImport);
export default Memo;
