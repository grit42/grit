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

const SvgDesktop42 = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M13.25 1a2.75 2.75 0 0 1 2.745 2.582L16 3.75v5.5a2.75 2.75 0 0 1-2.582 2.745L13.25 12h-2.66l.333 2H12a.5.5 0 0 1 .09.992L12 15H4a.5.5 0 0 1-.09-.992L4 14h1.076l.333-2H2.75A2.75 2.75 0 0 1 .005 9.418L0 9.25v-5.5a2.75 2.75 0 0 1 2.582-2.745L2.75 1h10.5ZM9.576 12H6.423l-.333 2h3.819l-.333-2ZM13.25 2H2.75a1.75 1.75 0 0 0-1.744 1.606L1 3.75v5.5a1.75 1.75 0 0 0 1.606 1.744L2.75 11h10.5a1.75 1.75 0 0 0 1.744-1.606L15 9.25v-5.5A1.75 1.75 0 0 0 13.25 2ZM8.027 3.002l.05.019 2.846 1.671c.047.028.077.08.077.137V8.17a.16.16 0 0 1-.077.137L8.078 9.979a.154.154 0 0 1-.155 0L5.078 8.308A.16.16 0 0 1 5 8.17V4.829c0-.057.03-.109.078-.137l2.845-1.671a.154.154 0 0 1 .155 0Zm1.147 1.905c-.399 0-.76.13-.99.257a.04.04 0 0 0-.02.035v.44a.04.04 0 0 0 .051.038c.18-.054.402-.088.597-.088.335 0 .5.146.5.441 0 .31-.21.56-.545.891l-.689.679a.043.043 0 0 0-.012.03v.437c0 .023.018.041.04.041h2.099a.04.04 0 0 0 .04-.038l.065-.846a.04.04 0 0 0-.04-.044h-.392a.04.04 0 0 0-.036.023l-.14.295h-.76V7.49l.397-.296c.563-.413.916-.805.916-1.31 0-.608-.384-.977-1.08-.977Zm-1.686.026h-.686a.038.038 0 0 0-.031.015L5.34 6.742a.041.041 0 0 0-.01.026v.38c0 .022.018.04.04.04h1.277v.407l-.301.063a.04.04 0 0 0-.032.04v.37c0 .022.018.04.04.04h1.448a.04.04 0 0 0 .04-.04v-.371a.04.04 0 0 0-.032-.04l-.283-.062V7.19h.293a.04.04 0 0 0 .04-.041v-.404a.04.04 0 0 0-.04-.04h-.293v-1.73a.04.04 0 0 0-.04-.04Zm-.84.888v.882H5.95V6.69l.679-.87h.018Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDesktop42);
export default Memo;
