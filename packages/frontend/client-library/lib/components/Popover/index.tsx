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

import classnames from "../../utils/classnames";
import { useContext, useEffect, useMemo, useState } from "react";
import Portal from "../Portal";
import styles from "./popover.module.scss";
import {
  arrow,
  autoPlacement,
  autoUpdate,
  FloatingArrow,
  offset,
  Placement,
  shift,
} from "@floating-ui/react";
import { useFloating } from "@floating-ui/react";
import useMountTransition, {
  TransitionState,
} from "../../hooks/useMountTransition";
import { DialogContext } from "../Dialog";

interface Props {
  className?: string;
  placement?: Placement;
  content?: string | JSX.Element;
  children?: JSX.Element;
  disabled?: boolean;
  zIndex?: number;
  showArrow?: boolean;
  childRef?: HTMLElement;
  initialOpen?: boolean;

  onClosed?: () => void;
}

const ALLOWED_OUTSIDE_CLICK_ELEMENTS = [".gwt-DialogBox"];

const PopoverRender = ({
  zIndex,
  placement: placementFromProps,
  childRef,
  content,
  setOpen,
  showTransition,
  transitionState,
  showArrow = true,
  onClosed,
}: Props & {
  setOpen: (value: boolean) => void;
  showTransition: boolean;
  transitionState: TransitionState;
  isOpen?: boolean;
}) => {
  const fromDialog = useContext(DialogContext);
  const [tooltipRef, setTooltipRef] = useState<HTMLDivElement | null>(null);
  const [arrowRef, setArrowRef] = useState<SVGSVGElement | null>(null);

  const middleware = useMemo(
    () => [
      ...(placementFromProps ? [] : [autoPlacement()]),
      shift({
        padding: 5,
      }),
      offset(16),
      ...(showArrow
        ? [
            arrow({
              element: arrowRef,
            }),
          ]
        : []),
    ],
    [arrowRef, placementFromProps, showArrow],
  );

  const { floatingStyles, placement, context } = useFloating({
    transform: false,
    placement: placementFromProps,
    middleware,
    whileElementsMounted: autoUpdate,
    elements: {
      floating: tooltipRef,
      reference: childRef,
    },
  });

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (childRef && childRef.contains(e.target as Node)) return;
      for (const selector of ALLOWED_OUTSIDE_CLICK_ELEMENTS) {
        if ((e.target as HTMLElement).closest(selector)) return;
      }
      setOpen(false);
    };

    window.addEventListener("click", handleOutsideClick);

    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [setOpen, tooltipRef, childRef]);

  return (
    <>
      <div
        className={classnames(styles.popover, styles[placement], {
          [styles.show as string]: showTransition,
          [styles.fromDialog as string]: fromDialog,
        })}
        onClick={(e) => {
          if (e.defaultPrevented) setOpen(false);

          e.stopPropagation();
        }}
        onTransitionEnd={() => {
          if (transitionState === "out") {
            if (onClosed) onClosed();
          }
        }}
        ref={(value) => {
          setTooltipRef(value);
        }}
        style={{
          ...floatingStyles,
          zIndex: zIndex ?? undefined,
          transition:
            transitionState === "idle" ? "inset 150ms ease-out" : undefined,
        }}
      >
        {showArrow && (
          <FloatingArrow
            ref={(value) => setArrowRef(value)}
            context={context}
            className={styles.arrow}
          />
        )}

        {content}
      </div>
    </>
  );
};

const Popover = (props: Props) => {
  const { children, disabled, initialOpen } = props;

  const [isOpen, setOpen] = useState(initialOpen ?? false);
  const { transitionState, showTransition } = useMountTransition(isOpen, 350);
  const [childRef, setChildRef] = useState<HTMLSpanElement | null>(null);

  if (disabled) return children ?? null;

  return (
    <>
      <Portal>
        {(isOpen || showTransition || transitionState === "out") && (
          <PopoverRender
            showTransition={showTransition}
            transitionState={transitionState}
            setOpen={setOpen}
            childRef={props.childRef ?? childRef ?? undefined}
            isOpen={isOpen}
            {...props}
          />
        )}
      </Portal>

      {!props.childRef && (
        <span
          ref={(value) => {
            setChildRef(value);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!isOpen);
          }}
          style={{
            display: "inline-flex",
            position: "relative",
          }}
        >
          {children}
        </span>
      )}
    </>
  );
};

export default Popover;
