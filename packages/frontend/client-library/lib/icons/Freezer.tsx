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

const SvgFreezer = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.58 0C15.36 0 16 .64 16 1.42v13.16c0 .78-.64 1.42-1.42 1.42H1.42C.64 16 0 15.36 0 14.58V1.42C0 .64.64 0 1.42 0Zm0 .94H1.42a.48.48 0 0 0-.48.48v13.16c0 .27.22.48.48.48h13.16c.27 0 .48-.22.48-.48V1.42a.48.48 0 0 0-.48-.48ZM8.02 3c.19 0 .34.15.34.34v1.15l.88-.49c.16-.09.37-.03.46.13.09.16.03.37-.13.46l-1.21.68v2.08l1.8-1.04-.01-1.39c0-.19.14-.34.33-.34.19-.01.34.14.34.33l.01 1.01 1-.58c.16-.1.37-.04.46.12.1.16.04.37-.12.46l-1 .58.87.51c.16.09.21.3.12.46a.324.324 0 0 1-.46.12l-1.19-.7-1.8 1.04 1.8 1.04 1.19-.7c.16-.09.37-.04.46.12.09.16.04.37-.12.46l-.87.51 1 .58c.16.09.22.3.1.47a.324.324 0 0 1-.46.12l-1-.58-.01 1.01c-.01.18-.16.33-.34.33-.18 0-.33-.15-.33-.34l.01-1.39-1.8-1.04v2.08l1.21.68c.16.09.22.3.13.46-.06.11-.17.17-.29.17-.05 0-.11-.01-.16-.04l-.88-.49v1.15c0 .19-.15.34-.34.34-.19 0-.34-.15-.34-.34v-1.15l-.88.49a.336.336 0 0 1-.45-.13.342.342 0 0 1 .13-.46l1.21-.68V8.52l-1.8 1.04.01 1.39c0 .19-.14.34-.33.34s-.34-.15-.34-.33l-.01-1.01-1 .58a.28.28 0 0 1-.17.05c-.11 0-.23-.06-.29-.17a.33.33 0 0 1 .12-.46l1-.58-.87-.51a.339.339 0 0 1-.12-.46c.09-.16.3-.21.46-.12l1.19.7 1.8-1.04-1.8-1.04-1.19.7c-.05.04-.11.05-.17.05-.12 0-.23-.06-.29-.17a.339.339 0 0 1 .12-.46l.87-.51-1-.58a.339.339 0 0 1-.12-.46c.09-.16.3-.21.46-.12l1 .58.01-1.01c.01-.18.16-.33.34-.33.18 0 .33.15.33.34l-.01 1.39 1.8 1.04V5.27l-1.21-.68a.342.342 0 0 1-.13-.46c.09-.16.3-.22.46-.13l.88.49V3.34c0-.19.15-.34.34-.34Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgFreezer);
export default Memo;
