import type { PropsWithChildren, ReactNode } from "react";
import { classnames } from "../../utils";
import styles from "./tabbedLayout.module.scss";

export interface TabbedLayoutProps {
  heading?: ReactNode;
}

const TabbedLayout = ({
  heading,
  children,
}: PropsWithChildren<TabbedLayoutProps>) => {
  return (
    <div
      className={classnames(styles.tabbedLayout, {
        [styles.withHeading]: heading !== null && heading !== undefined,
      })}
    >
      {heading}
      {children}
    </div>
  );
};

export default TabbedLayout;
