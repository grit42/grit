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

const SvgDesktopExport = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M12.91 2.992A.5.5 0 0 1 13 2h.25a2.75 2.75 0 0 1 2.745 2.582L16 4.75v5.5a2.75 2.75 0 0 1-2.582 2.745L13.25 13h-2.66l.333 2H12a.5.5 0 0 1 .09.992L12 16H4a.5.5 0 0 1-.09-.992L4 15h1.076l.333-2H2.75a2.75 2.75 0 0 1-2.745-2.582L0 10.25v-5.5a2.75 2.75 0 0 1 2.582-2.745L2.75 2H3a.5.5 0 0 1 0 1h-.25a1.75 1.75 0 0 0-1.744 1.606L1 4.75v5.5a1.75 1.75 0 0 0 1.606 1.744L2.75 12h10.5a1.75 1.75 0 0 0 1.744-1.606L15 10.25v-5.5a1.75 1.75 0 0 0-1.606-1.744L13.25 3H13ZM9.576 13H6.423l-.333 2h3.819l-.333-2ZM8 0h.012l.03.002a.502.502 0 0 1 .036.004l.012.002.016.003a.5.5 0 0 1 .068.02l.015.006.02.008a.496.496 0 0 1 .132.09l.013.011 2 2 .057.07a.5.5 0 0 1-.765.638L8.5 1.707V6.5a.5.5 0 0 1-.992.09L7.5 6.5V1.706L6.354 2.854a.5.5 0 0 1-.765-.638l.057-.07 2-2L7.66.135a.503.503 0 0 1 .039-.033l-.052.044a.502.502 0 0 1 .146-.1l.019-.01a.497.497 0 0 1 .015-.005l.018-.006A.5.5 0 0 1 7.91.008l.012-.002a.502.502 0 0 1 .035-.004L7.99 0A.51.51 0 0 1 8 0Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDesktopExport);
export default Memo;
