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

const SvgSheep = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="M6.769 1.6c.46 0 .923.107 1.358.307a.5.5 0 0 1-.42.908A2.25 2.25 0 0 0 6.77 2.6c-.66 0-1.285.296-1.704.807a.5.5 0 0 1-.508.167A2.21 2.21 0 0 0 2.12 4.597c-.5.833-.39 1.9.269 2.627a.5.5 0 0 1-.002.674 2.216 2.216 0 0 0 .838 3.57.412.412 0 0 1 .108.036c.386.129.808.148 1.221.042a.5.5 0 0 1 .51.167A2.203 2.203 0 0 0 8.19 12a.445.445 0 0 1 .112-.105c.062-.056.118-.117.171-.182a.5.5 0 0 1 .51-.167c.398.101.818.086 1.206-.04a.344.344 0 0 1 .1-.038c.102-.035.2-.081.295-.134a.5.5 0 0 1 .49.871l-.175.09v1.63a.5.5 0 0 1-.991.09l-.008-.09V12.59c-.242.03-.486.031-.73.005l-.091-.014v1.345a.5.5 0 0 1-.991.09l-.008-.09v-.686a3.2 3.2 0 0 1-1.106.274l-.205.007c-.465 0-.918-.1-1.33-.289v.694a.5.5 0 0 1-.991.09l-.008-.09-.001-1.34-.013.003c-.27.035-.542.036-.806.003v1.334a.5.5 0 0 1-.992.09l-.008-.09v-1.63a3.231 3.231 0 0 1-1.263-1.087l-.104-.163A3.214 3.214 0 0 1 1.286 7.7l.095-.143-.093-.141a3.212 3.212 0 0 1-.124-3.157l.098-.176a3.212 3.212 0 0 1 3.162-1.55l.074.011.072-.071a3.202 3.202 0 0 1 1.994-.867L6.77 1.6Zm4.245.902a3.557 3.557 0 0 1 3.477 3.019l.87 1.304a.5.5 0 0 1-.775.625l-.057-.07-.168-.251c-.486 1.827-1.955 3.656-3.513 3.656-1.554 0-3.018-1.816-3.509-3.651l-.163.246a.5.5 0 0 1-.876-.475l.044-.08L7.2 5.54a3.567 3.567 0 0 1 3.666-3.034l-.026-.001Zm.023 1-.167.003-.21-.001C9.33 3.538 8.233 4.59 8.166 5.917c0 1.64 1.44 3.868 2.683 3.868 1.242 0 2.682-2.228 2.683-3.845a2.554 2.554 0 0 0-2.661-2.435ZM9.718 5.698c.365 0 .67.275.718.627l.006.097c0 .365-.274.67-.626.718l-.098.006a.728.728 0 0 1-.698-.532l-.004-.017a.499.499 0 0 1-.031-.175c0-.397.327-.724.724-.724h.01Zm2.268 0c.337 0 .623.234.702.547.02.056.032.115.032.177a.727.727 0 0 1-.724.724h-.01a.727.727 0 0 1-.724-.724c0-.397.327-.724.724-.724Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgSheep);
export default Memo;
