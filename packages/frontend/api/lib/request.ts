/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/api.
 *
 * @grit42/api is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/api is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/api. If not, see <https://www.gnu.org/licenses/>.
 */

import axios, { AxiosRequestConfig, AxiosError } from "axios";

export const axiosClient = axios.create({
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  baseURL: "/api",
});

export interface EndpointResponse {
  success: boolean;
}

export interface EndpointSuccess<TData = unknown> extends EndpointResponse {
  success: true;
  data: TData;
}

export interface PaginatedEndpointSuccess<TData = unknown>
  extends EndpointSuccess<TData> {
  cursor: number;
  total: number;
}

export type RecordErrors<TData = unknown> = { [K in keyof TData]: string[] };
export type EndpointErrorErrors<TData = unknown> = string | RecordErrors<TData>;
export interface EndpointError<TError = string> extends EndpointResponse {
  success: false;
  errors?: TError;
}

// Global request utility
export async function request<TData, TError>(
  url: string,
  options: AxiosRequestConfig = {},
): Promise<TData | TError> {
  try {
    const response: TData = (
      await axiosClient(url, {
        method: "GET",
        ...options,
      })
    ).data;

    return response;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const error = err as AxiosError<TError>;

      if (error && error.response?.data) {
        return error.response.data;
      }

      throw new Error(error.message);
    }

    throw new Error("Something went wrong in the axios request, err: " + err);
  }
}

export type URLParams = {
  [key: string]:
    | string
    | number
    | string[]
    | number[]
    | Record<string, string | number | boolean>
    | boolean
    | undefined
    | null;
};

/**
 * Serializes an object into valid URL parameters
 */
export const getURLParams = (data: URLParams) => {
  if (!data || (data && data.constructor !== Object)) {
    throw new Error("'getURLParams' requires an object of parameters!");
  }

  return Object.keys(data)
    .flatMap((key) => {
      const value = data[key];

      if (value === null || value === undefined) {
        return null;
      }

      if (Array.isArray(data[key])) {
        return data[key].map((v) => `${key}[]=${encodeURIComponent(v)}`);
      } else if (typeof data[key] === "object") {
        const obj = data[key] as Record<string, string | number | boolean>;
        return Object.keys(obj).map(
          (prop) => `${key}[${prop}]=${encodeURIComponent(obj[prop])}`,
        );
      }

      return `${key}=${encodeURIComponent(
        data[key] as string | number | boolean,
      )}`;
    })
    .filter((v) => !!v)
    .join("&");
};

interface ColumnSort {
  desc: boolean;
  id: string;
}
type SortingState = ColumnSort[];

interface Filter {
  id: string;
  type: string;
  operator: string;
  column: string;
  property: string;
  property_type: string;
  active: boolean;
  value: any;
}

export const getSortParams = (sorting: SortingState) => {
  return {
    sort: JSON.stringify(
      sorting.map((s) => {
        return {
          property: s.id,
          direction: s.desc === true ? "DESC" : "ASC",
        };
      }),
    ),
  };
};

export const getFilterParams = (filters: Filter[]) => {
  return {
    filter: JSON.stringify(
      filters
        .map((filter) => {
          if (
            !filter.active ||
            !filter.operator ||
            !filter.column ||
            ((filter.value === null ||
              filter.value === undefined ||
              filter.value === "") &&
              !["empty", "not_empty"].includes(filter.operator))
          )
            return null;

          return {
            property: filter.property,
            operator: filter.operator,
            value: filter.value,
            type: filter.property_type,
          };
        })
        .filter((f) => f !== null),
    ),
  };
};
