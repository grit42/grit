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

import styles from "./toolbar.module.scss";
import { useCallback, useMemo } from "react";
import { classnames } from "@grit42/client-library/utils";
import { Dropdown, Tooltip } from "@grit42/client-library/components";
import { ToolbarActionItem } from "./types";
import { hasRoles } from "../features/session/utils";
import { useSession } from "../features/session";

interface Props {
  requiredRoles?: string[];
  label?: string;
  isExpanded: boolean;
  icon: React.ReactNode;
  disabled?: boolean;
  disabledMessage?: string;
  onClick?: () => void;
  size?: number;
  items?: ToolbarActionItem[];
  active?: boolean;
  className?: string;
}

const ToolbarIcon = ({
  label,
  isExpanded,
  icon,
  disabled,
  onClick,
  requiredRoles,
  items,
  active = false,
  className,
  disabledMessage,
}: Props) => {
  const { data: session } = useSession();

  const hasRequiredRoles =
    !requiredRoles || (session && hasRoles(session, requiredRoles));
  const isDisabled = disabled || !hasRequiredRoles;

  const clickHandler = useCallback(() => {
    if (isDisabled) return;
    if (onClick) {
      onClick();
      return;
    }
    if (items) {
      items[0].onClick();
      return;
    }
  }, [isDisabled, onClick, items]);

  const Icon = useMemo(() => {
    if (!items || !items.length || items.length === 1) {
      return (
        <div
          className={classnames(
            styles.toolbarIcon,
            {
              [styles.activeIcon as string]: active,
              [styles.disabled as string]: isDisabled,
            },
            className,
          )}
          onClick={!isDisabled ? clickHandler : undefined}
        >
          {icon}
        </div>
      );
    }
    const sortedItems = [...items].sort(({ order: a }, { order: b }) => {
      if (a === undefined || b === undefined) return 0;
      return a - b;
    });
    return (
      <Dropdown
        placement="bottom"
        menuItems={sortedItems}
        disabled={isDisabled}
      >
        <div
          className={classnames(
            styles.toolbarIcon,
            {
              [styles.activeIcon as string]: active,
            },
            className,
          )}
        >
          {icon}
        </div>
      </Dropdown>
    );
  }, [items, isDisabled, active, className, icon, clickHandler]);

  let tooltipContent = label ?? "";
  let tooltipDisabled = isDisabled || !hasRequiredRoles || isExpanded;
  if (isDisabled && disabledMessage) {
    tooltipDisabled = false;
    tooltipContent = disabledMessage;
  }

  return (
    <div
      className={classnames(styles.icon, {
        [styles.disabled as string]: isDisabled,
      })}
    >
      <Tooltip disabled={tooltipDisabled} content={tooltipContent} zIndex={999}>
        {Icon}
      </Tooltip>

      {label && isExpanded && (
        <p className={classnames(styles.label)}>{label}</p>
      )}
    </div>
  );
};

export default ToolbarIcon;
