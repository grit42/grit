import { useState } from "react";
import { CompoundData, useCompoundFields } from "../../../../queries/compounds";
import styles from "./compoundCv.module.scss";
import { useTheme } from "@grit42/client-library/hooks";

const ExpandText = ({
  text,
  maxLength = 10,
}: {
  text: string;
  maxLength: number;
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {isExpanded ? text : `${text.slice(0, maxLength)}... `}{" "}
      <button
        type="button"
        onClick={toggleExpanded}
        style={{
          color: theme.palette.primary.contrastText,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {isExpanded ? "Collapse Text" : "Expand Text"}
      </button>
    </span>
  );
};

const CollapseSection = ({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: string; value: React.ReactNode }[];
}) => {
  const theme = useTheme();
  const [isOpen, setOpen] = useState(true);

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span style={{ color: theme.palette.secondary.main }}>
          {" "}
          {title}
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <ul className={styles.sectionList}>
          {items.map((item) => (
            <li key={item.key} className={styles.sectionListItem}>
              <span className={styles.sectionLabel}>{item.label}:</span>{" "}
              <span className={styles.sectionValue}>{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const GeneralInfo = ({ compound }: { compound: CompoundData }) => {
  const { data: fields } = useCompoundFields(compound?.compound_type_id);

  const compoundInfoFields = [
    {
      key: "id",
      label: "ID",
      value: compound.id,
    },
    {
      key: "number",
      label: "Number",
      value: compound.number,
    },
    {
      key: "name",
      label: "Name",
      value: compound.name,
    },
    {
      key: "compound_type",
      label: "Compound type",
      value: compound.compound_type_id__name,
    },
  ];

  const moleculeInfoFields = ["molformula", "smiles", "inchi", "inchikey"];

  const moleculeInfoItems =
    fields
      ?.filter((field) => moleculeInfoFields.includes(field.name))
      .map((field) => ({
        key: field.name,
        label: field.display_name,
        value: compound[field.name],
      })) ?? [];

  const generalInfoItems = [...compoundInfoFields, ...moleculeInfoItems].map(
    (item) => ({
      ...item,
      value: (
        <ExpandText
          text={item.value === "string" ? item.value : String(item.value)}
          maxLength={100}
        />
      ),
    }),
  );

  return (
    <CollapseSection title="General Information" items={generalInfoItems} />
  );
};

const CalculatedProps = ({ compound }: { compound: CompoundData }) => {
  const { data: fields } = useCompoundFields(compound?.compound_type_id);

  const calculatedPropFields = ["molweight", "logp", "hbd", "hba"];

  const calculatedPropItems =
    fields
      ?.filter((field) => calculatedPropFields.includes(field.name))
      .map((field) => ({
        key: field.name,
        label: field.display_name,
        value: compound[field.name],
      })) ?? [];

  const calculatedPropItemsExpandable = calculatedPropItems.map((item) => ({
    ...item,
    value: (
      <ExpandText
        text={item.value === "string" ? item.value : String(item.value)}
        maxLength={100}
      />
    ),
  }));

  return (
    <CollapseSection
      title="Calculated Properties"
      items={calculatedPropItemsExpandable}
    />
  );
};

export { GeneralInfo, CalculatedProps };
