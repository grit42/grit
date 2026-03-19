import type {
  DetailedHTMLProps,
  HTMLAttributes,
  PropsWithChildren,
} from "react";
import styles from "./centeredColumnLayout.module.scss";
import { classnames } from "../../utils";

export type CenteredColumnLayoutProps = PropsWithChildren<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>;

const CenteredColumnLayout = ({
  children,
  className,
  ...props
}: CenteredColumnLayoutProps) => {
  return (
    <div
      className={classnames(styles.centeredColumnLayout, className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default CenteredColumnLayout;
