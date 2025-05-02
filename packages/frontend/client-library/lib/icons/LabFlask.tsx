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

const SvgLabFlask = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M1 15.68a.5.5 0 0 1-.09-.992L1 14.68l2.5-.001V.78a.5.5 0 0 1 .992-.09L4.5.78v2.379h4.999V1.28H9a.5.5 0 0 1-.09-.992L9 .28h4a.5.5 0 0 1 .09.992L13 1.28h-.501v4.047l.236.087c1.776.714 2.906 2.46 2.751 4.345l-.022.21c-.287 2.17-2.203 3.79-4.464 3.79-2.261 0-4.177-1.62-4.464-3.79-.269-2.035.971-3.946 2.929-4.63l.034-.011V4.159H4.5v10.52l2.5.001a.5.5 0 0 1 .09.992L7 15.68H1Zm10.499-14.4h-1v2.37a.51.51 0 0 1 .001.01l-.001.009.001 2.032a.5.5 0 0 1-.226.418l-.073.04-.08.027c-1.707.423-2.813 1.99-2.593 3.651.22 1.666 1.705 2.922 3.472 2.922s3.252-1.256 3.472-2.922c.22-1.662-.886-3.228-2.592-3.65a.5.5 0 0 1-.38-.486l-.001-4.421Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabFlask);
export default Memo;
