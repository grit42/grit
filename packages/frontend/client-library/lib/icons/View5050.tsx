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

const SvgView5050 = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="-19 -19 600 600"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path d="M251.25 12.5c0-6.906-5.594-12.5-12.5-12.5H12.5C5.594 0 0 5.594 0 12.5v226.25c0 6.906 5.594 12.5 12.5 12.5h226.25c6.906 0 12.5-5.594 12.5-12.5zm-25 213.75H25V25h201.25zM562.5 12.5C562.5 5.594 556.906 0 550 0H323.75c-6.906 0-12.5 5.594-12.5 12.5v226.25c0 6.906 5.594 12.5 12.5 12.5H550c6.906 0 12.5-5.594 12.5-12.5zm-25 213.75H336.25V25H537.5zM251.25 323.75c0-6.906-5.594-12.5-12.5-12.5H12.5c-6.906 0-12.5 5.594-12.5 12.5V550c0 6.906 5.594 12.5 12.5 12.5h226.25c6.906 0 12.5-5.594 12.5-12.5zm-25 212.5H25v-200h201.25zM562.5 323.75c0-6.906-5.594-12.5-12.5-12.5H323.75c-6.906 0-12.5 5.594-12.5 12.5V550c0 6.906 5.594 12.5 12.5 12.5H550c6.906 0 12.5-5.594 12.5-12.5zm-25 212.5H336.25v-200H537.5zm0 0" />
  </svg>
);

const Memo = memo(SvgView5050);
export default Memo;
