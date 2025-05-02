/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { Children, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./portal.module.scss";

function createWrapperAndAppendToBody(wrapperId?: string) {
  const wrapperElement = document.createElement("div");
  if (wrapperId) wrapperElement.setAttribute("id", wrapperId);
  wrapperElement.classList.add(styles.portal as string);
  document.body.appendChild(wrapperElement);
  return wrapperElement;
}

const getExisitingPortal = (wrapperId?: string) => {
  if (!wrapperId) {
    const elements = Array.prototype.filter.call(
      document.getElementsByClassName(styles.portal as string),
      (element: HTMLElement) => {
        return element.id === "";
      },
    );

    return elements[0] as HTMLElement;
  } else {
    return document.getElementById(wrapperId);
  }
};

interface Props {
  children: React.ReactNode;
  wrapperId?: string;
}

export const ConditionalPortal = ({
  children,
  wrapperId,
  usePortal,
}: Props & { usePortal: boolean }) => {
  if (!usePortal) return <>{children}</>;

  return <Portal wrapperId={wrapperId}>{children}</Portal>;
};

const Portal = ({ children, wrapperId }: Props) => {
  const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(
    null,
  );

  useLayoutEffect(() => {
    let element = getExisitingPortal(wrapperId);

    // if element is not found with wrapperId or wrapperId is not provided,
    // create and append to body
    if (!element) {
      element = createWrapperAndAppendToBody(wrapperId);
    }

    // If element is found, and both this wrapper and the element have no children,
    // then we remove it from the DOM.
    if (
      element &&
      Children.toArray(children).length <= 0 &&
      element.children.length <= 0
    ) {
      element.remove();
      element = null;
    }

    setWrapperElement(element);
  }, [wrapperId, children]);

  // wrapperElement state will be null on the very first render.
  if (wrapperElement === null) return null;

  return createPortal(children, wrapperElement);
};

export default Portal;
