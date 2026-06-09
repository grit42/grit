import { Button, ButtonGroup } from "@grit42/client-library/components";
import { useLoadSetCreatorContext } from "../LoadSetCreatorContext";
import { AnyFormApi, AnyFormState } from "@grit42/form";
import styles from "./loadSetCreator.module.scss";

const LoadSetBlocksFormHeader = ({ form }: { form: AnyFormApi }) => {
  const { onCancel } = useLoadSetCreatorContext();
  const Subscribe = (form as any).Subscribe;

  return (
    <div className={styles.header}>
      <h1>Configure blocks</h1>
      <Subscribe
        selector={(state: AnyFormState) => [
          state.canSubmit,
          state.isSubmitting,
        ]}
        children={([canSubmit, isSubmitting]: [boolean, boolean, number]) => {
          return (
            <ButtonGroup>
              <Button onClick={onCancel}>Cancel import</Button>
              <Button
                color="secondary"
                disabled={!canSubmit}
                type="submit"
                loading={isSubmitting}
              >
                Continue
              </Button>
            </ButtonGroup>
          );
        }}
      />
    </div>
  );
};

export default LoadSetBlocksFormHeader;
