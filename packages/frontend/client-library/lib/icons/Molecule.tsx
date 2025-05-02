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

const SvgMolecule = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M12.819 2.176a.5.5 0 0 1 .814.574l-.777 1.345 1.456 2.522h1.224a.49.49 0 0 1 .481.5c0 .246-.17.45-.394.492l-.087.008h-1.359l-1.288 2.23.744 1.289a.5.5 0 0 1-.814.574l-.052-.074-.677-1.172H9.265l-1.376 2.383.744 1.289a.5.5 0 0 1-.814.574l-.052-.074-.677-1.172H4.009l-.676 1.172-.052.074a.5.5 0 0 1-.814-.574l.726-1.26-1.304-2.259H.5a.5.5 0 0 1-.09-.992l.09-.008h1.254l1.472-2.551-.759-1.316a.5.5 0 0 1 .814-.574l.052.074.742 1.285h2.726l1.425-2.469-.759-1.316a.5.5 0 0 1 .814-.574l.052.074.742 1.285h2.949l.743-1.285ZM6.842 7.535H4.111L2.688 10l1.423 2.463 2.845.001 1.366-2.366-1.48-2.563Zm5.114-3H9.11L7.744 6.9l1.479 2.563 2.733.001L13.38 7l-1.423-2.464Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgMolecule);
export default Memo;
