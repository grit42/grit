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

const SvgPig = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    {...props}
  >
    <path
      d="m10.937 2.235.007.082-.001 1.418.048.007c1.731.32 3.137 2.11 3.23 4.004l.004.196c0 .208.166.429.48.638.22.147.447.248.584.294a.5.5 0 0 1 .342.48l-.005.157h.003l-.005.052-.002.084c-.01.195-.028.39-.054.584a.499.499 0 0 1-.06.18 3.705 3.705 0 0 1-.27.88c-.219.457-.508.536-1.177.514l-.299-.013-.26-.007c-.03-.003-.04-.009-.033-.022-.23.45-.713.61-1.432.666l-.199.013-.483.007-.337 1.352a.968.968 0 0 1-.82.727l-.12.008h-.673a.968.968 0 0 1-.905-.62l-.036-.114-.286-1.142H6.146l-.285 1.141a.968.968 0 0 1-.82.727l-.12.008h-.6a.968.968 0 0 1-.963-.87c-.077-.757-.305-1.36-.638-1.527C1.502 11.53.57 9.798.57 7.942c0-.73.199-1.45.54-2.086a3.141 3.141 0 0 1 .005-3.336.5.5 0 0 1 .847.531 2.149 2.149 0 0 0-.198 1.88c.642-.703 1.488-1.177 2.403-1.234l.184-.005h2.813c.196 0 .637-.19 1.192-.522l.17-.104.352-.228c.2-.133.4-.272.596-.414l.387-.288.271-.21a.5.5 0 0 1 .806.31Zm-.994 1.081-.196.14-.315.214-.379.245-.183.112c-.638.383-1.154.615-1.572.658l-.136.007H4.35c-.865 0-1.695.58-2.22 1.4a3.457 3.457 0 0 0-.562 1.85c0 1.423.67 2.736 1.472 3.231l.127.072c.699.349 1.03 1.126 1.161 2.106l.022.184h.547l.374-1.496a.5.5 0 0 1 .4-.371l.085-.007H8.57a.5.5 0 0 1 .457.298l.028.08.373 1.496h.626l.421-1.684a.5.5 0 0 1 .355-.362l.038-.01.084-.014.183-.01.562-.009.263-.014c.085-.006.162-.015.23-.025l.182-.033.127-.033.07-.026c.006-.003.01-.006.01-.008.23-.449.546-.535 1.19-.515l.486.02c.061.004.087.01.086.03l-.004.015.043-.1c.098-.25.176-.613.23-1.084l-.012-.006a3.768 3.768 0 0 1-.294-.158l-.152-.097c-.564-.376-.926-.858-.926-1.47 0-1.644-1.342-3.25-2.781-3.25a.5.5 0 0 1-.492-.41l-.008-.09-.001-.876Zm1.204 3.188c.372 0 .679.277.728.635l.006.1a.735.735 0 0 1-.634.727l-.1.007a.734.734 0 0 1 0-1.469Z"
      fillRule="nonzero"
    />
  </svg>
);

const Memo = memo(SvgPig);
export default Memo;
