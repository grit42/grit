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

import React, { createContext, useCallback, useEffect, useRef } from "react";
import classnames from "../../utils/classnames";
import Portal from "../Portal";
import styles from "./dialog.module.scss";
import useMountTransition, {
  TransitionState,
} from "../../hooks/useMountTransition";
import { Helmet } from "react-helmet-async";
import Cross from "../../icons/Cross";

export const DialogContext = createContext(false);

export interface DialogProps {
  /**
   * Dialog contents.
   */
  children?: React.ReactNode;

  /**
   * Toggles the visibility of the overlay and children.
   * This prop is required because the component is controlled.
   */
  isOpen: boolean;

  /**
   * Wether the application should acquire focus when the dialog is opened.
   * @default true
   */
  autoFocus?: boolean;

  /**
   * Wether to show the close button or not
   * @default true
   */
  isCloseButtonShown?: boolean;

  /**
   * Wether pressing the "esc" key should close the dialog
   * @default true
   */
  canEscapeKeyClose?: boolean;

  /**
   * Whether the application should return focus to the last active element in the
   * document after this overlay closes.
   *
   * @default true
   */
  shouldReturnFocusOnClose?: boolean;

  /**
   * Name of a Grit42Icon to render in the dialog's header.
   */
  icon?: React.ReactNode | null;

  className?: string;

  withTable?: boolean;
  isWide?: boolean;
  isFullscreen?: boolean;

  /**
   * Title of the dialog.
   */
  title?: React.ReactNode;

  style?: React.CSSProperties;

  canOutsideClickClose?: boolean;

  onClose?: () => void;
  onClosed?: () => void;

  headerMargin?: boolean;
}

const DialogContent = ({
  children,
  icon,
  title,
  showTransition,
  isWide,
  isFullscreen,
  withTable,
  onClosed,
  onClose,
  transitionState,
  className,
  canEscapeKeyClose = true,
  isCloseButtonShown = true,
  shouldReturnFocusOnClose = true,
  canOutsideClickClose = true,
  autoFocus = true,
  headerMargin = true,
}: DialogProps & {
  showTransition: boolean;
  transitionState: TransitionState;
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!previousFocus.current) {
      previousFocus.current = document.activeElement as HTMLElement;
    }

    if (autoFocus) overlayRef.current?.focus();
  }, [overlayRef, previousFocus, autoFocus]);

  const closeDialog = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && canEscapeKeyClose) {
      e.stopPropagation();
      closeDialog();
    }
  };

  return (
    <DialogContext.Provider value={true}>
      <div
        className={styles.overlay}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        data-title={title}
        ref={overlayRef}
      >
        <Helmet>
          <html style={{ overflow: "hidden" }} />
        </Helmet>

        <div
          className={classnames(styles.backdrop, {
            [styles.show as string]: showTransition,
          })}
          onClick={() => {
            if (!canOutsideClickClose) return;

            closeDialog();
          }}
        />
        <div
          ref={ref}
          onKeyDown={handleKeyDown}
          className={classnames(styles.dialog, className, {
            [styles.show as string]: showTransition,
            [styles.withTable as string]: withTable === true,
            [styles.wide as string]: isWide === true,
            [styles.fullscreen as string]: isFullscreen === true,
          })}
          onTransitionEnd={() => {
            if (transitionState === "out") {
              if (
                shouldReturnFocusOnClose &&
                previousFocus.current &&
                previousFocus.current instanceof HTMLElement
              ) {
                previousFocus.current.focus();
              }

              if (onClosed) {
                onClosed();
              }
            }
          }}
        >
          <div
            className={styles.header}
            style={{ margin: headerMargin ? undefined : "unset" }}
          >
            <div className={styles.icon}>{icon}</div>

            <h2 className={styles.title}>{title}</h2>

            {isCloseButtonShown && (
              <div
                className={styles.closeIconWrapper}
                onClick={(e) => {
                  e.stopPropagation();
                  closeDialog();
                }}
              >
                <Cross className={styles.closeIcon} />
              </div>
            )}
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </DialogContext.Provider>
  );
};

const Dialog = (props: DialogProps) => {
  const { isOpen, onClose } = props;
  const { transitionState, showTransition } = useMountTransition(isOpen, 350);

  const handleOnClose = () => {
    if (onClose) onClose();
  };

  return (
    <>
      <Portal wrapperId="dialog">
        {(isOpen || showTransition || transitionState === "out") && (
          <DialogContent
            showTransition={showTransition}
            transitionState={transitionState}
            {...props}
            onClose={handleOnClose}
          />
        )}
      </Portal>
    </>
  );
};

export default Dialog;
