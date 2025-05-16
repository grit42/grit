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

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import classnames from "../../utils/classnames";
import Portal from "../Portal";
import styles from "./tooltip.module.scss";
import {
  useFloating,
  Placement,
  autoPlacement,
  arrow,
  offset,
  autoUpdate,
  shift,
  FloatingArrow,
} from "@floating-ui/react";

interface Props {
  placement?: Placement;
  content: string | JSX.Element;
  disabled?: boolean;
  isTutorial?: boolean;
  zIndex?: number;
  className?: string;
}

interface TooltipRenderProps extends Props {
  childRef: HTMLSpanElement | null;
  onTransitionEnd: () => void;
  isHovering: boolean;
}

interface TooltipProps extends Props {
  children: React.ReactNode;
}

export const TooltipRender = ({
  placement: placementFromProps,
  childRef,
  content,
  zIndex,
  onTransitionEnd,
  isHovering,
  className,
}: TooltipRenderProps) => {
  const [showing, setShowing] = useState(false);
  const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);
  const [arrowRef, setArrowRef] = useState<SVGSVGElement | null>(null);

  useLayoutEffect(() => {
    setShowing(true);
  }, []);

  const middleware = useMemo(
    () => [
      ...(placementFromProps ? [] : [autoPlacement()]),
      shift(),
      offset(14),
      arrow({
        element: arrowRef,
      }),
    ],
    [arrowRef, placementFromProps],
  );

  const { floatingStyles, placement, context } = useFloating({
    placement: placementFromProps,
    middleware,
    whileElementsMounted: autoUpdate,
    elements: {
      floating: tooltipRef,
      reference: childRef,
    },
  });

  return (
    <div
      className={classnames(className, styles.tooltip, styles[placement], {
        [styles.show as string]: showing && isHovering,
      })}
      onTransitionEnd={(e) => {
        e.persist();
        onTransitionEnd();
      }}
      ref={(value) => {
        setTooltipRef(value);
      }}
      style={{
        ...floatingStyles,
        zIndex: zIndex ?? undefined,
      }}
    >
      <FloatingArrow
        ref={(value) => setArrowRef(value)}
        context={context}
        className={styles.arrow}
      />
      {content}
    </div>
  );
};

const Tooltip = (props: TooltipProps) => {
  const { content, children, disabled, isTutorial } = props;

  const [isHovering, setHovering] = useState(false);
  const [isTransitioning, setTransitioning] = useState(false);
  const [childRef, setChildRef] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    const node = childRef;
    if (!node) return;

    const onMouseEnter = () => {
      setHovering(true);
    };

    const onMouseLeave = () => {
      setTransitioning(true);
      setHovering(false);
    };

    node.addEventListener("mouseenter", onMouseEnter);
    node.addEventListener("mouseleave", onMouseLeave);

    return () => {
      node.removeEventListener("mouseenter", onMouseEnter);
      node.removeEventListener("mouseenter", onMouseLeave);

      setTransitioning(true);
      setHovering(false);
    };
  }, [childRef]);

  if (disabled || !content || content === "") return <>{children}</>;

  return (
    <span
      ref={(value) => {
        setChildRef(value);
      }}
      style={{ display: "inline-flex", position: "relative" }}
    >
      <Portal>
        {(isHovering || isTransitioning || isTutorial) && (
          <TooltipRender
            childRef={childRef}
            isHovering={isHovering || isTutorial === true}
            onTransitionEnd={() => {
              setTransitioning(false);
            }}
            {...props}
          />
        )}
      </Portal>

      {children}
    </span>
  );
};

export default Tooltip;
