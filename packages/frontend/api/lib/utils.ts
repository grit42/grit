/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/api.
 *
 * @grit/api is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/api is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/api. If not, see <https://www.gnu.org/licenses/>.
 */

import { DefaultError, MutateOptions } from "@tanstack/react-query";
import { toast } from "../../notifications/lib";

export const notifyOnError = <
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  error: TError,
  _variables: TVariables,
  _context: TContext,
): MutateOptions<TData, TError, TVariables, TContext>["onError"] => {
  if (typeof error === "string") {
    toast.error(error);
  }
  return;
};
