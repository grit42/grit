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

const SvgTube = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M12.154.7c.266 0 .483.198.524.452l.007.087-.001.737h.085c.237 0 .435.157.504.37l.02.083.007.087c0 .266-.19.49-.444.532l-.087.007H8.684v6.626l-.003.033-.012.065-1.353 5.47A1.365 1.365 0 0 1 6 16.3a1.36 1.36 0 0 1-1.277-.922l-.039-.13-1.353-5.47-.012-.064-.004-.067V3.055h-.084a.531.531 0 0 1-.504-.37l-.02-.082-.007-.087c0-.266.19-.49.444-.532l.087-.007 6.545-.001v-.737c0-.236.151-.44.363-.511l.082-.02.087-.008h1.846ZM7.623 3.055H4.376l-.008 6.49 1.346 5.44a.3.3 0 0 0 .286.236c.11 0 .211-.066.262-.17l.024-.066 1.337-5.368V3.055Zm4-1.277h-.785v.198h.785v-.198Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgTube);
export default Memo;
