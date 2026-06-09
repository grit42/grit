import { DetailedHTMLProps, HTMLAttributes, PropsWithChildren } from "react";
import { Surface } from "../../components";
import styles from "./centeredSurface.module.scss";
import { classnames } from "../../utils";

export type CenteredSurfaceProps = PropsWithChildren<
  DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
>;

const CenteredSurface = ({
  children,
  className,
  ...props
}: CenteredSurfaceProps) => {
  return (
    <div className={styles.container}>
      <Surface className={classnames(styles.surface, className)} {...props}>
        {children}
      </Surface>
    </div>
  );
};

export default CenteredSurface;
