import { RoutedTabs } from "@grit42/client-library/components";
import styles from "./settings.module.scss";

const DataTableSettingsPage = () => {
  return (
    <div className={styles.settingsPage}>
      <RoutedTabs
        matchPattern="/assays/data_tables/:data_table_id/settings/:tab/*"
        tabs={[
          { label: "General", url: "general" },
          { label: "Entities", url: "entities" },
          { label: "Assay columns", url: "assay-columns" },
          { label: "Entity columns", url: "entity-columns" },
        ]}
        navigationPattern="relative-sibling"
      />
    </div>
  );
};

export default DataTableSettingsPage;
