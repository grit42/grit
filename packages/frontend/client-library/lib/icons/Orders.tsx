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

const SvgOrders = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M7.5 7a.5.5 0 0 1 .09.993L7.5 8 6.5 8v5.5a2.5 2.5 0 0 1-2.336 2.495L4 16.001a2.5 2.5 0 0 1-2.5-2.5V8h-1a.5.5 0 0 1-.09-.991L.5 7h7Zm4.271-7a1 1 0 0 1 .982 1.2l-.031.116-.229.684h1.974a1.5 1.5 0 0 1 1.493 1.356l.007.144v11a1.5 1.5 0 0 1-1.356 1.493l-.144.007H9l-.09-.007a.5.5 0 0 1-.402-.402L8.5 15.5a.5.5 0 0 1 .41-.492L9 15 14.467 15a.5.5 0 0 0 .492-.41l.008-.09v-11a.5.5 0 0 0-.41-.492L14.467 3h-2.308l-.104.316a1 1 0 0 1-.833.677L11.106 4H6.827a1 1 0 0 1-.906-.576l-.043-.108L5.773 3H3.467a.5.5 0 0 0-.492.41l-.008.09L2.966 5a.511.511 0 0 1-.416.493l-.09.008a.5.5 0 0 1-.496-.568L1.967 3.5a1.5 1.5 0 0 1 1.355-1.493L3.467 2h1.972l-.227-.683a1 1 0 0 1 .073-.801l.064-.101a1 1 0 0 1 .692-.408L6.161 0h5.61ZM5.5 10h-3v3.5a1.5 1.5 0 0 0 1.215 1.474l.14.02L4 15a1.5 1.5 0 0 0 1.5-1.5V10Zm0-2h-3v1h3V8Zm6.273-7H6.16L6.6 2.32a.496.496 0 0 1 .005.013L6.827 3h4.28l.666-2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgOrders);
export default Memo;
