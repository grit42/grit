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

const SvgMinusSquare = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 612 612"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path d="M420.75 286.875h-229.5c-10.557 0-19.125 8.568-19.125 19.125s8.568 19.125 19.125 19.125h229.5c10.557 0 19.125-8.568 19.125-19.125s-8.568-19.125-19.125-19.125zM535.5 0h-459C34.253 0 0 34.253 0 76.5v459C0 577.747 34.253 612 76.5 612h459c42.247 0 76.5-34.253 76.5-76.5v-459C612 34.253 577.747 0 535.5 0zm38.25 535.5c0 21.133-17.117 38.25-38.25 38.25h-459c-21.133 0-38.25-17.117-38.25-38.25v-459c0-21.133 17.117-38.25 38.25-38.25h459c21.133 0 38.25 17.136 38.25 38.25v459z" />
  </svg>
);

const Memo = memo(SvgMinusSquare);
export default Memo;
