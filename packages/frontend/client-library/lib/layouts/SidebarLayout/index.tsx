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
  }
>;

const SidebarLayout = ({
  children,
  sidebar,
  className,
  ...props
}: SidebarLayoutProps) => {
  return (
    <div
      className={classnames(
        styles.sidebarLayout,
        {
          [styles.sidebar]: !!sidebar,
        },
        className,
      )}
      {...props}
    >
      {sidebar}
      {children}
    </div>
  );
};

export default SidebarLayout;
