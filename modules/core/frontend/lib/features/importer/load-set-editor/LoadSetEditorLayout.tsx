import { LoadSetBlockData } from "../types/load_set_blocks";
import { Outlet } from "react-router-dom";
import { LoadSetData } from "../types/load_sets";
import { PageLayout, SidebarLayout } from "@grit42/client-library/layouts";
import { EntityInfo } from "../../entities";
import LoadSetEditorHeader from "./LoadSetEditorHeader";
import LoadSetEditorSidebar from "./LoadSetEditorSidebar";
import styles from "./loadSetEditor.module.scss";

const LoadSetEditorLayout = ({
  loadSetBlocks,
  loadSet,
  entityInfo,
}: {
  loadSet: LoadSetData;
  loadSetBlocks: LoadSetBlockData[];
  entityInfo: EntityInfo;
}) => {
  if (loadSetBlocks?.length === 0) {
    return null;
  }

  return (
    <PageLayout
      heading={
        <LoadSetEditorHeader
          loadSet={loadSet}
          loadSetBlocks={loadSetBlocks}
          entityInfo={entityInfo}
        />
      }
    >
      <SidebarLayout
        className={styles.layout}
        collapsed={loadSetBlocks.length === 1}
        sidebar={<LoadSetEditorSidebar loadSetBlocks={loadSetBlocks} />}
      >
        <Outlet />
      </SidebarLayout>
    </PageLayout>
  );
};

export default LoadSetEditorLayout;
