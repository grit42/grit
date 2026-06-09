/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { ReactElement, ReactNode } from "react";
import {
  render as rtlRender,
  RenderOptions,
  renderHook as rtlRenderHook,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@grit42/api";

/**
 * Creates a new QueryClient with disabled retries for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Creates a minimal wrapper with QueryClient for testing hooks
 */
export function createQueryWrapper(
  queryClient: QueryClient = createTestQueryClient(),
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Creates a full wrapper with QueryClient and Router for testing components
 */
export function createTestWrapper(
  queryClient: QueryClient = createTestQueryClient(),
  initialRoute = "/",
) {
  // Set initial URL for router
  if (initialRoute !== "/") {
    window.history.pushState({}, "", initialRoute);
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    );
  };
}

/**
 * Custom render function that includes all necessary providers
 */
export function render(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialRoute = "/",
    ...renderOptions
  }: RenderOptions & {
    queryClient?: QueryClient;
    initialRoute?: string;
  } = {},
) {
  const Wrapper = createTestWrapper(queryClient, initialRoute);
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Custom renderHook function with QueryClient provider
 */
export function renderHook<TResult, TProps>(
  hook: (props: TProps) => TResult,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: {
    queryClient?: QueryClient;
  } & Parameters<typeof rtlRenderHook<TResult, TProps>>[1] = {},
) {
  const Wrapper = createQueryWrapper(queryClient);
  return rtlRenderHook(hook, { wrapper: Wrapper, ...options });
}

// Re-export commonly used testing library utilities (excluding render and renderHook which we override)
export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
