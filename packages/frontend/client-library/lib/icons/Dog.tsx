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

const SvgDog = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M12.012 1.27a2.664 2.664 0 0 1 2.25 1.445l.053.112 1.244.419a.5.5 0 0 1 .306.29l.025.085.032.208c.048.395.044.817-.048 1.226-.213.945-.852 1.555-1.914 1.611l-.115.003-.043.248-.041.29-.063.555-.023.23c-.144 1.44-.366 2.142-1.12 2.745l-.066.049v3.133l.471.001a.5.5 0 0 1 .492.41l.008.09a.5.5 0 0 1-.41.492l-.09.008h-.883l-.007.002-.09.008h-1.94a.5.5 0 0 1-.48-.357l-.016-.08-.436-3.453H6.63l-.076-.006c-.327.22-.725.374-1.196.447l-.242.029-.405 2.423.059.005a.5.5 0 0 1 .402.402l.008.09a.5.5 0 0 1-.41.492l-.09.008h-.462a.496.496 0 0 1-.09.01l-.09-.007-.012-.003H2.73a.5.5 0 0 1-.487-.386c-.45-1.92-.776-3.89-.983-5.954 0-.418.09-.827.256-1.2a2.855 2.855 0 0 1-.408-.252C.131 6.422-.242 5.222.316 3.561a.5.5 0 0 1 .948.318c-.42 1.25-.189 1.996.435 2.453.133.097.267.17.385.221l.032-.037a2.956 2.956 0 0 1 1.864-.848l.21-.008 4.422.002a.709.709 0 0 0 .407-.089c-.25-.404-.24-1.012.008-1.829l.19-.567c.452-1.272 1.186-1.907 2.795-1.906Zm-.022 1c-1.054 0-1.461.3-1.774 1.088l-.075.204-.155.463-.081.26c-.012.039-.023.077-.032.113l-.047.197c-.081.417.035.537.42.567l.18.007.104.001c.32 0 .415-.043.444-.1a.464.464 0 0 0 .04-.176l.004-.156L11 3.97a.5.5 0 1 1 1 0l.019.712c.004.4-.03.596-.153.84-.226.446-.676.648-1.336.648-.225 0-.427-.017-.606-.051-.32.343-.763.543-1.211.547L8.57 6.66H4.19a1.955 1.955 0 0 0-1.515.73 1.885 1.885 0 0 0-.418 1.15c.172 1.69.431 3.347.779 4.968l.094.422h.568l.499-2.982a.5.5 0 0 1 .493-.418c.893 0 1.415-.28 1.702-.74.17-.273.228-.551.228-.71a.5.5 0 0 1 1 0c0 .261-.06.601-.227.96H9.55a.5.5 0 0 1 .48.357l.016.08.435 3.453h1.009v-3.4a.5.5 0 0 1 .223-.416c.628-.417.812-.835.943-1.995l.094-.882.043-.34.048-.297.026-.14.062-.282.036-.15a.5.5 0 0 1 .54-.375c.877.098 1.253-.195 1.393-.818.051-.225.063-.47.048-.709l-.004-.032-1.161-.39a.5.5 0 0 1-.276-.227l-.038-.084A1.66 1.66 0 0 0 11.99 2.27Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgDog);
export default Memo;
