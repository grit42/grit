import { Tabs } from "@grit42/client-library/components";
import { useLoadSetCreatorContext } from "../LoadSetCreatorContext";
import { PageLayout } from "@grit42/client-library/layouts";
import { Form, FormFieldDef, useForm } from "@grit42/form";
import styles from "./loadSetCreator.module.scss";
import { useState } from "react";
import BlockForm from "./BlockForm";
import {
  useCreateLoadSet,
  useInitializeLoadSetBlocks,
} from "../../api/mutations/load_sets";
import { useNavigate } from "react-router-dom";
import { newLoadSetPayload } from "./utils";
import LoadSetBlocksFormHeader from "./LoadSetBlocksFormHeader";

const LoadSetBlocksForm = ({
  loadSetFields,
  loadSetBlockFields,
}: {
  loadSetFields: FormFieldDef[];
  loadSetBlockFields: FormFieldDef[];
}) => {
  const { blocks, loadSet } = useLoadSetCreatorContext();
  const createLoadSet = useCreateLoadSet();
  const initializeBlocks = useInitializeLoadSetBlocks();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      blocks,
    },
    onSubmit: async ({ value }) => {
      const res = await createLoadSet.mutateAsync(
        newLoadSetPayload(
          { ...loadSet, ...value },
          loadSetFields,
          loadSetBlockFields,
        ),
      );
      await initializeBlocks.mutateAsync(res.id);
      navigate(`../${res.id}`, { relative: "path" });
    },
  });

  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <Form form={form} className={styles.loadSetBlockCreatorForm}>
      <PageLayout heading={<LoadSetBlocksFormHeader form={form} />}>
        <Tabs
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          className={styles.loadSetBlockFormTabs}
          tabs={blocks.map((block, index) => ({
            key: block.id,
            name: block.name,
            panelProps: {
              className: styles.loadSetBlockFormTab,
            },
            panel: (
              <BlockForm
                blockIndex={index}
                form={form}
                fields={loadSetBlockFields}
              />
            ),
          }))}
        />
      </PageLayout>
    </Form>
  );
};

export default LoadSetBlocksForm;
