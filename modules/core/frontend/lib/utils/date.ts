/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/core.
 *
 * @grit/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/core. If not, see <https://www.gnu.org/licenses/>.
 */

import dayjs from "dayjs";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const formatDateNumber = (number: number) => {
  return number >= 10 ? number : `0${number}`;
};

export const formatDate = (date: Date, withTime?: boolean) => {
  return (
    `${formatDateNumber(date.getDate())} ${months[date.getMonth()]?.slice(
      0,
      3,
    )}. ${date.getFullYear()}` +
    (withTime
      ? `, ${formatDateNumber(date.getHours())}:${formatDateNumber(
          date.getMinutes(),
        )} UTC${date.getTimezoneOffset() > 0 ? "-" : "+"}${Math.abs(
          date.getTimezoneOffset() / 60,
        )}`
      : "")
  );
};

export const formatDateToInput = (
  date: Date | string | number,
  withTime?: boolean,
) => {
  return withTime
    ? dayjs(date).format("YYYY-MM-DDTHH:mm:ss")
    : dayjs(date).format("YYYY-MM-DD");
};
