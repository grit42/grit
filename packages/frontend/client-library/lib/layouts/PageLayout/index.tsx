import type {
  DetailedHTMLProps,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";
import styles from "./pageLayout.module.scss";
import { classnames } from "../../utils";

export type PageLayoutProps = PropsWithChildren<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    heading?: ReactNode;
  }
>;

const PageLayout = ({
  children,
  heading,
  className,
  ...props
}: PageLayoutProps) => {
  return (
    <div
      className={classnames(
        styles.pageLayout,
        {
          [styles.heading]: !!heading,
        },
        className,
      )}
      {...props}
    >
      {heading}
      {children}
    </div>
  );
};

export default PageLayout;
