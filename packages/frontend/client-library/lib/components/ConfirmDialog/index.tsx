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

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import Dialog from "../Dialog";
import Button from "../Button";
import ButtonGroup from "../ButtonGroup";
import Input from "../Input";
import Surface from "../Surface";
import styles from "./confirm-dialog.module.scss";

export interface ConfirmOptions {
  /**
   * Title rendered in the dialog header.
   */
  title?: React.ReactNode;

  /**
   * Body content rendered below the title.
   */
  body?: React.ReactNode;

  /**
   * Label for the accept button.
   * @default "OK"
   */
  acceptLabel?: string;

  /**
   * Label for the reject button.
   * @default "Cancel"
   */
  rejectLabel?: string;

  /**
   * When true, the accept button is styled as a danger action (red).
   * @default false
   */
  danger?: boolean;

  /**
   * When set, the user must type this exact string (case-sensitive) before
   * the accept button becomes enabled.
   */
  challenge?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Hook that returns a `confirm` function which opens a confirm dialog
 * and returns a promise that resolves to `true` (accepted) or `false` (rejected).
 *
 * Must be used within a `ConfirmDialogProvider`.
 *
 * @example
 * ```tsx
 * const confirm = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "Delete items",
 *     body: "Are you sure?",
 *     acceptLabel: "Delete",
 *     danger: true,
 *   });
 *   if (!confirmed) return;
 *   await deleteMutation.mutateAsync();
 * };
 * ```
 */
export const useConfirm = (): ConfirmFn => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return confirm;
};

export const ConfirmDialogProvider = ({
  children,
}: React.PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [challengeValue, setChallengeValue] = useState("");
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    setChallengeValue("");
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setIsOpen(false);
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const handleAccept = useCallback(() => settle(true), [settle]);
  const handleReject = useCallback(() => settle(false), [settle]);

  const {
    title = "Confirm",
    body,
    acceptLabel = "OK",
    rejectLabel = "Cancel",
    danger = false,
    challenge,
  } = options;

  const isChallengeRequired = challenge !== undefined && challenge !== "";
  const isChallengeComplete =
    !isChallengeRequired || challengeValue === challenge;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        isOpen={isOpen}
        onClose={handleReject}
        title={title}
        isCloseButtonShown={false}
        canOutsideClickClose={false}
        canEscapeKeyClose={true}
      >
        <Surface className={styles.content}>
          {body && <div className={styles.body}>{body}</div>}

          {isChallengeRequired && (
            <div className={styles.challenge}>
              <div className={styles.challengePrompt}>
                Type <code>{challenge}</code> to confirm
              </div>
              <Input
                type="string"
                value={challengeValue}
                onChange={(e) => setChallengeValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </Surface>

        <div className={styles.footer}>
          <ButtonGroup>
            <Button variant="transparent" onClick={handleReject}>
              {rejectLabel}
            </Button>
            <Button
              color={danger ? "danger" : "primary"}
              onClick={handleAccept}
              disabled={!isChallengeComplete}
            >
              {acceptLabel}
            </Button>
          </ButtonGroup>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
};
