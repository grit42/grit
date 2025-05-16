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

const SvgUserSettings = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m11.502 6 .14.007a1.386 1.386 0 0 1 1.186.98l.295.97c.024.082.108.13.19.111l.984-.228a1.392 1.392 0 0 1 1.327 2.307l-.687.74a.167.167 0 0 0 0 .229l.686.74a1.392 1.392 0 0 1-1.328 2.306l-.981-.227a.162.162 0 0 0-.192.113l-.294.963a1.387 1.387 0 0 1-2.656.001l-.295-.97a.161.161 0 0 0-.19-.11l-.985.228a1.392 1.392 0 0 1-1.327-2.306l.688-.742a.167.167 0 0 0-.001-.228l-.685-.74a1.392 1.392 0 0 1 1.327-2.306l.982.227c.083.019.166-.03.191-.113l.295-.967A1.387 1.387 0 0 1 11.502 6ZM11.5 7l-.072.007a.388.388 0 0 0-.3.269l-.294.966a1.161 1.161 0 0 1-1.373.797l-.98-.227a.392.392 0 0 0-.372.651l.686.74a1.166 1.166 0 0 1 0 1.589l-.688.743a.392.392 0 0 0 .372.65l.982-.228a1.16 1.16 0 0 1 1.373.796l.295.97a.387.387 0 0 0 .742-.002l.294-.963a1.161 1.161 0 0 1 1.374-.797l.98.227a.392.392 0 0 0 .372-.652l-.686-.74a1.166 1.166 0 0 1-.001-1.589l.688-.742a.392.392 0 0 0-.371-.65l-.983.228a1.16 1.16 0 0 1-1.372-.796l-.296-.97A.387.387 0 0 0 11.5 7Zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM6.963 6.9a.5.5 0 1 1-.392.92A4.002 4.002 0 0 0 1 11.5a.5.5 0 0 1-1-.001 5.002 5.002 0 0 1 6.963-4.598Zm4.537 3.6a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1ZM5 0a3.25 3.25 0 1 1 0 6.5A3.25 3.25 0 0 1 5 0ZM2.82 2.692l-.024.103a2.25 2.25 0 1 0 4.43.78 5.063 5.063 0 0 1-4.407-.883ZM5 1c-.684 0-1.297.306-1.71.788a4.057 4.057 0 0 0 3.851.774A2.248 2.248 0 0 0 5 1Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgUserSettings);
export default Memo;
