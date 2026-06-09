import { Button, Surface } from "@grit42/client-library/components";
import { LoadSetBlockData } from "../types/load_set_blocks";
import { NavLink } from "react-router-dom";
import styles from "./loadSetEditor.module.scss";
import { classnames } from "@grit42/client-library/utils";

const LoadSetBlockLink = ({
  loadSetBlock,
}: {
  loadSetBlock: LoadSetBlockData;
}) => {
  return (
    <NavLink
      key={loadSetBlock.id}
      to={`../${loadSetBlock.id}`}
      relative="path"
      className={styles.navLink}
    >
      {(props) => (
        <Button
          className={classnames(styles.navLinkButton, {
            [styles.active]: props.isActive,
          })}
          variant={props.isActive ? "filled" : "transparent"}
          loading={props.isPending}
        >
          <span className={styles.navLinkContent}>
            <span>{loadSetBlock.name}</span>
          </span>
        </Button>
      )}
    </NavLink>
  );
};

const LoadSetBlocksSidebarSection = ({
  loadSetBlockStatus,
  loadSetBlocks,
}: {
  loadSetBlockStatus: string;
  loadSetBlocks?: LoadSetBlockData[];
}) => {
  if (!loadSetBlocks || loadSetBlocks.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "var(--spacing-md)",
      }}
    >
      <h4>{loadSetBlockStatus}</h4>
      <nav className={styles.nav}>
        {loadSetBlocks.map((block) => (
          <LoadSetBlockLink key={block.id} loadSetBlock={block} />
        ))}
      </nav>
      <div
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "grey",
        }}
      />
    </div>
  );
};

const LoadSetEditorSidebar = ({
  loadSetBlocks,
}: {
  loadSetBlocks: LoadSetBlockData[];
}) => {
  const blocksByStatus = loadSetBlocks.reduce(
    (acc, block) => {
      if (!acc[block.status_id__name]) acc[block.status_id__name] = [];
      acc[block.status_id__name].push(block);
      return acc;
    },
    {} as Record<string, LoadSetBlockData[]>,
  );

  return (
    <Surface className={styles.sidebar}>
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Created"
        loadSetBlocks={blocksByStatus.Created}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Initializing"
        loadSetBlocks={blocksByStatus.Initializing}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Errored"
        loadSetBlocks={blocksByStatus.Errored}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Invalidated"
        loadSetBlocks={blocksByStatus.Invalidated}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Mapping"
        loadSetBlocks={blocksByStatus.Mapping}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Validating"
        loadSetBlocks={blocksByStatus.Validating}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Validated"
        loadSetBlocks={blocksByStatus.Validated}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Confirming"
        loadSetBlocks={blocksByStatus.Confirming}
      />
      <LoadSetBlocksSidebarSection
        loadSetBlockStatus="Succeeded"
        loadSetBlocks={blocksByStatus.Succeeded}
      />
    </Surface>
  );
};

export default LoadSetEditorSidebar;
