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

const SvgCat = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m10.872 1.237.006.084v2.695c0 .785-.332 1.517-.888 2.03v6.962a.5.5 0 0 1-.993.09l-.008-.09V6.587a.5.5 0 0 1-.166-.958 1.756 1.756 0 0 0 1.05-1.464l.005-.15V2.13l-1.073.536a.5.5 0 0 1-.146.047l-.077.006h-.899a.5.5 0 0 1-.152-.024l-.071-.029-1.074-.536v1.886c0 .425.157.828.428 1.14a.38.38 0 0 1 .06.063c.1.105.213.198.337.276l.132.074a.5.5 0 0 1-.456.89 2.78 2.78 0 0 1-.218-.124L5.457 9.163a.5.5 0 0 1-.348.29 2.476 2.476 0 0 0-1.87 1.87 4.55 4.55 0 0 0-.007 1.976c.116.55.58.954 1.14 1.009l.13.006h7.251c.645 0 .68-1.118.102-1.236l-.102-.01a.5.5 0 1 1 0-1c1.96 0 2.013 3.073.16 3.24l-.16.006h-7.25a2.288 2.288 0 0 1-2.25-1.806c-.172-.8-.169-1.617.01-2.404A3.468 3.468 0 0 1 4.502 8.59l.13-.043 1.262-2.946a2.735 2.735 0 0 1-.5-1.393l-.007-.192V1.32a.5.5 0 0 1 .646-.479l.077.032 1.692.845h.66l1.693-.845a.5.5 0 0 1 .717.363Zm-3.18 7.678a.5.5 0 0 1 .492.41l.008.09v3.593a.5.5 0 0 1-.991.09l-.008-.09V9.415a.5.5 0 0 1 .5-.5Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgCat);
export default Memo;
