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

const SvgViewCompounds = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M10.302 1.176a.5.5 0 0 1 .814.574l-.8 1.386-.026.036.899 1.554h2.845l1.5 2.598-1.256 2.173a.5.5 0 0 1 .003.003l.052.074.8 1.386a.5.5 0 0 1-.814.574l-.052-.074-.8-1.386a.5.5 0 0 1-.057-.151h-2.376l-1.155-2h-2.69l-.81 1.401 1.155 2-1.225 2.121c.02.017.038.035.055.055l.052.074.8 1.386a.5.5 0 0 1-.814.574l-.052-.074-.8-1.386a.5.5 0 0 1-.057-.151h-1.92a.5.5 0 0 1-.057.151l-.8 1.386-.052.074a.5.5 0 0 1-.814-.574l.8-1.386.052-.074a.496.496 0 0 1 .055-.055l-.868-1.504H.481a.49.49 0 0 1-.481-.5c0-.245.17-.45.394-.492l.087-.008h1.273l.935-1.617-1.155-2 1.164-2.019-.048-.07-.8-1.385a.5.5 0 0 1 .814-.574l.052.074.795 1.376H5.88l.895-1.554-.025-.036-.8-1.386a.5.5 0 0 1 .814-.574l.052.074.8 1.386c.017.03.03.06.041.09H9.41a.502.502 0 0 1 .041-.09l.8-1.386ZM5.569 9.922H3.496l-.808 1.402.923 1.597 1.845.001.923-1.598-.81-1.402Zm7.887-4.196H11.61l-.923 1.598.923 1.597 1.845.001.923-1.598-.923-1.598Zm-8 0H3.61l-.923 1.598.809 1.401H5.57l.81-1.401-.924-1.598Zm4-2H7.61l-.923 1.598.923 1.597 1.845.001.923-1.598-.923-1.598Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgViewCompounds);
export default Memo;
