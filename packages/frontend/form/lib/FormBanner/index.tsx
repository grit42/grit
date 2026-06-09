import { classnames } from "@grit42/client-library/utils";
import styles from "./formBanner.module.scss";

const FormBanner = ({
  content,
  type = "error",
}: {
  content?: string | null;
  type?: "info" | "error";
}) => {
  if (!content || content.trim().length === 0) {
    return null;
  }

  return (
    <div className={classnames(styles.banner, styles[type])}>{content}</div>
  );
};

export default FormBanner;
