import type {
  DetailedHTMLProps,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";
import styles from "./sidebarLayout.module.scss";
import { classnames } from "../../utils";

export type SidebarLayoutProps = PropsWithChildren<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    sidebar?: ReactNode;
    collapsed?: boolean;
  }
>;

const SidebarLayout = ({
  children,
  sidebar,
  collapsed,
  className,
  ...props
}: SidebarLayoutProps) => {
  return (
    <div
      className={classnames(
        styles.sidebarLayout,
        {
          [styles.sidebar]: !collapsed && !!sidebar,
        },
        className,
      )}
      {...props}
    >
      {!collapsed && sidebar}
      {children}
    </div>
  );
};

export default SidebarLayout;
