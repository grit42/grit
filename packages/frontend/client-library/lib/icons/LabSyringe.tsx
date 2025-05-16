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

const SvgLabSyringe = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m11.911.26.07.057 3.535 3.536a.5.5 0 0 1-.638.765l-.069-.058-.707-.707-1.768 1.768 1.768 1.767a.5.5 0 0 1-.638.765l-.07-.057-.708-.71-1.754 1.757a.51.51 0 0 1-.012.013l-.016.012-2.088 2.091a.508.508 0 0 1-.018.019l-.02.015-1.749 1.75a1.5 1.5 0 0 1-2.006.105l-.113-.103-1.415 1.415a.5.5 0 0 1-.638.058l-.069-.058-.354-.354L1.02 15.52a.5.5 0 0 1-.765-.638l.058-.069L1.727 13.4l-.353-.353a.5.5 0 0 1-.058-.638l.058-.07 1.415-1.413a1.499 1.499 0 0 1-.433-.913l-.008-.149c0-.398.158-.78.44-1.06l5.657-5.657-.707-.707a.5.5 0 0 1 .638-.765l.069.058L10.213 3.5l1.768-1.768-.708-.708a.5.5 0 0 1 .638-.765ZM3.495 11.631l-1.061 1.06.349.348a.51.51 0 0 1 .005.005l.005.006.348.348 1.06-1.06-.706-.707Zm5.656-7.78L3.495 9.51a.5.5 0 0 0 0 .707l2.12 2.12a.5.5 0 0 0 .707 0l1.414-1.415-1.059-1.058a.5.5 0 0 1 .638-.765l.07.057 1.058 1.059L9.857 8.8 8.798 7.742a.5.5 0 0 1 .638-.765l.07.058 1.058 1.059 1.414-1.415-2.827-2.827Zm3.536-1.413L10.92 4.207l.707.707 1.767-1.768-.707-.707Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgLabSyringe);
export default Memo;
