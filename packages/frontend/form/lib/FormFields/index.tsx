import { PropsWithChildren } from "react";
import styles from "./formFields.module.scss";

interface Props {
  columns?: number;
}

const FormFields = ({ children, columns = 2 }: PropsWithChildren<Props>) => {
  return (
    <div
      className={styles.fields}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {children}
    </div>
  );
};

export default FormFields;
