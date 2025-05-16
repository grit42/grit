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

const SvgGuineaPig = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M3.934 3.524c-1.87.173-3.9 1.874-3.9 3.976 0 2.238 1.713 3.747 3.427 4.188.12.329.38.527.78.593.67.111 1.112-.1 1.173-.295a.339.339 0 0 0 .008-.164h1.554c.394 0 .77-.034 1.193-.097l.4-.066.553-.099c.104-.016.173-.024.222-.025l.136.11.051.037c.135.09.302.17.52.244.4.136.737.22.988.235.481.028.884-.256.72-.751l-.04-.102c-.087-.189-.037-.328.25-.354l.105-.004c.565 0 1.087-.277 1.647-.759l.635-.584.518-.172.055-.02c.762-.28 1.18-.774 1.016-1.613-.46-2.362-3.22-4.022-4.97-4.022h-.107l-.235.01-.27.02-.32.029-1.607.177-.407.031-.149.005-.082-.004-.155-.017-.227-.038-1.418-.281-.338-.062c-.703-.122-1.257-.17-1.726-.126Zm1.573 1.013.324.059 1.332.266.355.062.18.022.145.007.292-.01.322-.025 1.526-.168.51-.048.263-.017.22-.005c1.362 0 3.72 1.42 4.086 3.294.056.288-.028.423-.334.554l-.164.062-.382.123a1.208 1.208 0 0 0-.374.18l-.122.108-.487.45a3.375 3.375 0 0 1-.064.058c-.411.353-.765.541-1.061.541l-.146.005c-.753.057-1.149.552-1.146 1.105l.001.047a5.01 5.01 0 0 1-.282-.08l-.343-.116a.386.386 0 0 1-.077-.043l-.194-.154c-.153-.124-.318-.178-.55-.178-.09 0-.187.01-.314.029l-.682.12c-.515.09-.933.136-1.365.136H4.895c-.238-.315-.576-.63-.94-.382a1.234 1.234 0 0 0-.29.27C2.318 10.45.936 9.238.936 7.5c0-1.577 1.632-2.945 3.082-3.08.373-.034.858.007 1.49.117Zm6.244 1.086a1.405 1.405 0 0 0-1.887.344l-.467.628A1.142 1.142 0 0 0 9.72 8.25a2.453 2.453 0 0 0 2.196.177.451.451 0 0 0-.34-.835 1.549 1.549 0 0 1-1.387-.113.24.24 0 0 1-.068-.347l.467-.628a.505.505 0 0 1 .683-.118.451.451 0 0 0 .48-.764Zm1.247.927a.423.423 0 0 0-.422.425.427.427 0 0 0 .852-.009.42.42 0 0 0-.43-.416Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgGuineaPig);
export default Memo;
