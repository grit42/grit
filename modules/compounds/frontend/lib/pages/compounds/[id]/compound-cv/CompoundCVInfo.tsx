import { ReactNode, useState } from "react";
import { Surface } from "@grit42/client-library/components";
import { useTheme } from "@grit42/client-library/hooks";
import { CompoundData, useCompoundFields } from "../../../../queries/compounds";
import { AsyncMoleculeViewer } from "../../../../components/MoleculeViewer";
import styles from "./compoundCv.module.scss";

const MoleculeViewer = ({ compound }: { compound: CompoundData }) => (
  <div className={styles.moleculeViewer}>
    {compound.molecule ? (
      <AsyncMoleculeViewer molfile={compound.molecule} />
    ) : (
      "No molecule data available."
    )}
  </div>
);

const ExpandableText = ({
  text,
  maxLength = 100,
}: {
  text: string;
  maxLength?: number;
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;
  if (text.length <= maxLength) return <span>{text}</span>;

  return (
    <span>
      {isExpanded ? text : `${text.slice(0, maxLength)}... `}{" "}
      <button
        type="button"
        onClick={() => setIsExpanded((previous) => !previous)}
        style={{
          color: theme.palette.primary.contrastText,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {isExpanded ? "Collapse text" : "Expand text"}
      </button>
    </span>
  );
};

interface InfoItem {
  key: string;
  label: string;
  value: ReactNode;
}

const CollapsibleInfoSection = ({
  title,
  items,
}: {
  title: string;
  items: InfoItem[];
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.infoSection}>
      <button
        type="button"
        className={styles.infoSectionHeader}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span style={{ color: theme.palette.secondary.main }}>
          {title} {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <ul className={styles.infoSectionList}>
          {items.map((item) => (
            <li key={item.key} className={styles.infoSectionItem}>
              <span className={styles.infoSectionItemLabel}>{item.label}:</span>{" "}
              <span className={styles.infoSectionItemValue}>{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const toExpandableItems = (
  items: { key: string; label: string; value: unknown }[],
): InfoItem[] =>
  items.map(({ key, label, value }) => ({
    key,
    label,
    value: <ExpandableText text={value == null ? "" : String(value)} />,
  }));

const GeneralInfoSection = ({ compound }: { compound: CompoundData }) => {
  const { data: fields } = useCompoundFields(compound.compound_type_id);

  const coreItems = [
    { key: "id", label: "ID", value: compound.id },
    { key: "number", label: "Number", value: compound.number },
    { key: "name", label: "Name", value: compound.name },
    {
      key: "compound_type",
      label: "Compound type",
      value: compound.compound_type_id__name,
    },
  ];

  const moleculeFieldNames = ["molformula", "smiles", "inchi", "inchikey"];
  const moleculeItems =
    fields
      ?.filter((field) => moleculeFieldNames.includes(field.name))
      .map((field) => ({
        key: field.name,
        label: field.display_name,
        value: compound[field.name],
      })) ?? [];

  return (
    <CollapsibleInfoSection
      title="General Information"
      items={toExpandableItems([...coreItems, ...moleculeItems])}
    />
  );
};

const CalculatedPropertiesSection = ({
  compound,
}: {
  compound: CompoundData;
}) => {
  const { data: fields } = useCompoundFields(compound.compound_type_id);

  const calculatedFieldNames = ["molweight", "logp", "hbd", "hba"];
  const items =
    fields
      ?.filter((field) => calculatedFieldNames.includes(field.name))
      .map((field) => ({
        key: field.name,
        label: field.display_name,
        value: compound[field.name],
      })) ?? [];

  return (
    <CollapsibleInfoSection
      title="Calculated Properties"
      items={toExpandableItems(items)}
    />
  );
};

const CompoundCVInfoSidebar = ({
  compound,
  toggleButton,
}: {
  compound: CompoundData;
  // The collapse toggle is created by the parent (it owns the collapse state) and rendered here.
  toggleButton: ReactNode;
}) => {
  if (!compound) return null;

  return (
    <Surface className={styles.sidebarSurface}>
      <div className={styles.sidebarHeader}>{toggleButton}</div>
      <MoleculeViewer compound={compound} />
      <GeneralInfoSection compound={compound} />
      <CalculatedPropertiesSection compound={compound} />
    </Surface>
  );
};

export default CompoundCVInfoSidebar;
