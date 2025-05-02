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

const SvgStudies = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M14.407 5.338c.331.24.542.608.585 1.01l.008.153v4.882c0 .575-.342 1.09-.842 1.31l-.128.048-5.852 2.227a.522.522 0 0 1-.142.032L8.001 15a.495.495 0 0 1-.083-.007l-.042-.009-.006-.001.014.003a.499.499 0 0 1-.05-.015l-.012-.004-5.961-2.269a1.437 1.437 0 0 1-.854-1.174L1 11.383V6.5a1.437 1.437 0 0 1 1.735-1.407l.147.04L4 5.565c.273.021.49.248.49.525a.52.52 0 0 1-.52.52l.029-.003.001.03-.082-.03a.517.517 0 0 1-.26-.101l-1.09-.423-.076-.016a.437.437 0 0 0-.484.351L2 6.501v4.882c0 .162.09.309.244.39l.082.034 5.173 1.968v-2.776a.502.502 0 1 1 1 .011l.001 2.765 5.198-1.977a.437.437 0 0 0 .274-.26l.02-.076.008-.08V6.502a.437.437 0 0 0-.118-.3l-.062-.054-.072-.042a.442.442 0 0 0-.226-.043l-.069.014-1.453.56-.001-.029-.029.003a.52.52 0 0 1-.512-.427l-.008-.093a.52.52 0 0 1 .55-.52v-.005l1.118-.431a1.437 1.437 0 0 1 1.29.204ZM11.5 1a.5.5 0 0 1 .09.992L11.5 2h-1v5.5a2.5 2.5 0 0 1-2.336 2.495L8 10a2.5 2.5 0 0 1-2.5-2.5V2h-1a.5.5 0 0 1-.09-.992L4.5 1h7Zm-2 3h-3v3.5a1.5 1.5 0 0 0 1.215 1.473l.14.02L8 9a1.5 1.5 0 0 0 1.5-1.5V4Zm0-2h-3v1h3V2Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgStudies);
export default Memo;
