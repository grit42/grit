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

import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.scss";
import Spinner from "../Spinner";
import classnames from "../../utils/classnames";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  size?: "tiny" | "small" | "large";
  attention?: boolean;
  variant?: "filled" | "transparent";
  color?: "primary" | "secondary" | "danger" | "warning";
  icon?: ReactNode;
  loading?: boolean;
}

const Button = ({
  children,
  className,
  size = "small",
  variant = "filled",
  icon,
  loading = false,
  color = "primary",
  attention,
  ...props
}: ButtonProps) => {
  return (
    <button
      role="button"
      type="button"
      className={classnames(
        styles.button,
        {
          [styles.attention as string]: attention === true,
          [styles.tiny as string]: size === "tiny",
          [styles.small as string]: size === "small",
          [styles.large as string]: size === "large",
          [styles.filled as string]: variant === "filled",
          [styles.transparent as string]: variant === "transparent",
          [styles[color as string] as string]: color !== undefined,
          [styles.disabled as string]: !!props.disabled,
        },
        className,
      )}
      {...props}
    >
      {icon && !loading && icon}
      {!loading &&
        (typeof children === "string" ? <span>{children}</span> : children)}
      {loading && <Spinner size={14} />}
    </button>
  );
};

export default Button;
