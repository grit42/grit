/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/table.
 *
 * @grit42/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/table. If not, see <https://www.gnu.org/licenses/>.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// jsdom reports zero layout dimensions, which makes @tanstack/react-virtual
// think the scroll container has no visible area and virtualize away every
// row. Give elements a plausible size so virtualized rows actually render.
Element.prototype.getBoundingClientRect = () =>
  ({
    width: 1000,
    height: 500,
    top: 0,
    left: 0,
    bottom: 500,
    right: 1000,
    x: 0,
    y: 0,
    toJSON() {},
  }) as DOMRect;

// @tanstack/react-virtual measures elements via ResizeObserver; jsdom doesn't
// implement layout, so it never fires. Invoke the callback synchronously with
// the (mocked) getBoundingClientRect size so the virtualizer gets a real size.
global.ResizeObserver = class ResizeObserver {
  callback: globalThis.ResizeObserverCallback;
  constructor(callback: globalThis.ResizeObserverCallback) {
    this.callback = callback;
  }
  disconnect() {}
  observe(target: Element) {
    const rect = target.getBoundingClientRect();
    this.callback(
      [
        {
          target,
          contentRect: rect,
          borderBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
          contentBoxSize: [{ blockSize: rect.height, inlineSize: rect.width }],
          devicePixelContentBoxSize: [
            { blockSize: rect.height, inlineSize: rect.width },
          ],
        } as ResizeObserverEntry,
      ],
      this as unknown as globalThis.ResizeObserver,
    );
  }
  unobserve() {}
} as unknown as typeof ResizeObserver;
