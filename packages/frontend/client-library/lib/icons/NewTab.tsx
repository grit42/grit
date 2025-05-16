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

const SvgNewTab = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <g transform="translate(-3.498 -4.0742)">
      <path
        d="m4.9183 20.02c-0.49127-0.11962-0.95031-0.49589-1.1826-0.96938-0.25438-0.51845-0.24466-0.22104-0.233-7.1344l0.010569-6.2634 0.10141-0.27719c0.25268-0.69064 0.7452-1.1408 1.3817-1.2629 0.16542-0.031721 0.95041-0.041415 2.6735-0.033015l2.4393 0.011891 0.16789 0.089637c0.57204 0.30541 0.5236 1.1787-0.07936 1.4306-0.12491 0.0522-0.45656 0.06042-2.4388 0.06055-2.1758 1.36e-4 -2.3004 0.0039-2.4144 0.07345-0.26907 0.16408-0.25066-0.30133-0.24971 6.3136 8.21e-4 5.776 0.0032 5.9708 0.07499 6.1289 0.14087 0.31027-0.40662 0.28555 6.325 0.28555 6.5678 0 6.1464 0.01487 6.3072-0.22242 0.07019-0.10356 0.07513-0.23378 0.09361-2.4706 0.01736-2.1004 0.02665-2.3742 0.08411-2.4784 0.14588-0.26444 0.40141-0.40981 0.72038-0.40981 0.29392 0 0.51919 0.12871 0.66783 0.38157l0.10837 0.18435 0.01094 2.3585c0.0091 1.9525 9.99e-4 2.4112-0.04683 2.6647-0.14895 0.78973-0.70718 1.3986-1.4199 1.5487-0.30881 0.06503-12.833 0.05489-13.102-0.01061zm6.1034-7.1192c-0.26645-0.13919-0.4303-0.38694-0.4553-0.68841-0.03461-0.41728-0.17915-0.25232 3.0886-3.525l3.0104-3.015h-1.0645c-0.87248 0-1.0905-0.0109-1.209-0.06041-0.30981-0.12945-0.47739-0.39272-0.47739-0.75001 0-0.29202 0.14974-0.54806 0.39804-0.68063l0.16789-0.089637 2.0881-0.012399c2.3933-0.014211 2.4169-0.012041 2.6745 0.24555 0.25759 0.25759 0.25976 0.28123 0.24555 2.6745l-0.0124 2.0881-0.08963 0.16789c-0.30541 0.57203-1.1787 0.5236-1.4306-0.07936-0.04937-0.11816-0.0604-0.33373-0.0604-1.1801 0-0.56954-0.01322-1.0355-0.02937-1.0355-0.01616 0-1.3553 1.3278-2.976 2.9507-2.0103 2.013-2.9962 2.9739-3.1027 3.0239-0.23418 0.10986-0.51405 0.0974-0.76577-0.0341z"
        fillRule="nonzero"
      />
    </g>
  </svg>
);

const Memo = memo(SvgNewTab);
export default Memo;
