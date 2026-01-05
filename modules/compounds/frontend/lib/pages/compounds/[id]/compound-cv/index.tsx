/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ErrorPage,
  Spinner,
  Surface,
  Tabs,
} from "@grit42/client-library/components";
import {
  useParams,
  useNavigate,
} from "react-router-dom";
import {
  CompoundData,
  useCompound,
  useCompoundFields,
} from "../../../../queries/compounds";
import { AsyncMoleculeViewer } from "../../../../components/MoleculeViewer";
import styles from "./compoundCv.module.scss";
import { useState, useMemo } from "react";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { EntityData, useInfiniteEntityData } from "@grit42/core";

const MoleculeViewer = ({ compound }: { compound: CompoundData }) => {
  return (
    <div className={styles.moleculeContainer}>
      {compound.molecule ? (
        <AsyncMoleculeViewer molfile={compound.molecule} />
      ) : (
        "No molecule data available."
      )}
    </div>
  );
};

const FilterCompoundFields = ({
  compound,
  FieldNames,
}: {
  compound: CompoundData;
  FieldNames: string[];
}) => {
  // string[] is an array of strings
  // Is there a better way to get CompoundFields?
  const { data: fields } = useCompoundFields(compound?.compound_type_id);
  const filteredFields = fields?.filter((field) =>
    FieldNames.includes(field.display_name),
  );
  return filteredFields;
};

const GeneralInfo = ({ compound }: { compound: CompoundData }) => {

  const FieldNamesExtension = [
    "Molecular formula",
    "Canonical SMILES",
    "InChI",
    "InChI Key",
  ];
  const GenFieldsExt = FilterCompoundFields({
    compound,
    FieldNames: FieldNamesExtension,
  });

  // when using map in <ul>, each <li> needs a unique key prop
  const generalInfoItems = [
    { key: "id", label: "ID", value: compound.id },
    { key: "number", label: "Number", value: compound.number },
    { key: "name", label: "Name", value: compound.name },
    { key: "compound_type", label: "Compound type", value: compound.compound_type_id__name },
    // Extend with additional fields
    ...(GenFieldsExt ?? []).map((field) => ({
      key: field.name,
      label: field.display_name,
      value: compound[field.name],
    })),
  ];

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {generalInfoItems.map((item) => (
        <li key={item.key}>
          {item.label}: {item.value}
        </li>
      ))}
    </ul>
  );
};

const CalcProps = ({ compound }: { compound: CompoundData }) => {
  const FieldNames = [
    "MW",
    "LogP",
    "Hydrogen Bond Donor Count",
    "Hydrogen Bond Acceptor Count",
  ];
  const CalcPropFields = FilterCompoundFields({ compound, FieldNames });

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {CalcPropFields?.map((field) => (
        <li key={field.name}>
          {field.display_name}: {compound[field.name]}
        </li>
      ))}
    </ul>
  );
};

const CompoundCVTabs = ({ compound }: { compound: CompoundData }) => {
  // Tabs can be added here in the future
  const [state, setState] = useState(0);

  return (
    <Tabs
      selectedTab={state}
      onTabChange={setState}
      tabs={[
        {
          key: "general_information",
          name: "General Information",
          panel: <GeneralInfo compound={compound} />,
        },
        {
          key: "calculated_properties",
          name: "Calculated Properties",
          panel: <CalcProps compound={compound} />,
        },
      ]}
    />
  );
};

const CompoundCVTableTabs = ({ compound }: { compound: CompoundData }) => {
  // Tabs can be added here in the future
  const [state, setState] = useState(0);

  return (
    <Tabs
      selectedTab={state}
      onTabChange={setState}
      tabs={[
        {
          key: "experiments",
          name: "Experiments",
          panel: <CompoundCVExperimentTable compound={compound} />,
        },
      ]}
    />
  );
};


interface CompoundCVData extends EntityData {
  id: number;
  entity_id_value: number;
  value: number;
  assay_data_sheet_column_id: number;
  experiment_data_sheet_record_id: number;
  assay_data_sheet_column_id__name: string;
  assay_data_sheet_definition_id: number;
  assay_data_sheet_definition_id__name: string;
  experiment_data_sheet_id: number;
  experiment_id: number;
  experiment_id__name: string;
  assay_id: number;
  assay_id__name: string;
  unit_id: number;
  unit_id__name: string | null;
}

const CompoundCVExperimentTable = ({
  compound,
}: {
  compound: CompoundData;
}) => {
  const navigate = useNavigate();

  const tableColumns = useTableColumns<CompoundCVData>([
    {
      name: "value",
      display_name: "Value",
      default_hidden: false,
      required: false,
      type: "decimal",
      unique: false,
    },
    {
      name: "assay_data_sheet_column_id__unit_name",
      display_name: "Unit",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "assay_data_sheet_column_id__name",
      display_name: "Column",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "assay_data_sheet_definition_id__name",
      display_name: "Data Sheet",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "experiment_id__name",
      display_name: "Experiment",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
    {
      name: "assay_id__name",
      display_name: "Assay",
      default_hidden: false,
      required: false,
      type: "string",
      unique: false,
    },
  ]);

  const tableState = useSetupTableState<CompoundCVData>(
    "experiment-data-sheet-records-list",
    tableColumns,
    {
      saveState: true,
      settings: {
        enableColumnDescription: true,
        enableColumnOrderReset: true,
      },
    },
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteEntityData<CompoundCVData>(
      "grit/compounds/compounds",
      tableState.sorting,
      tableState.filters,
      {
        compound_id: compound.id,
        scope: "cv",
      },
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table
      loading={isLoading && !isFetchingNextPage}
      header="" // "Experiment Overview"
      data={flatData}
      tableState={tableState}
      rowActions={undefined}
      onRowClick={(row) =>
        navigate(
          `/assays/experiments/${row.original.experiment_id.toString()}/sheets/${row.original.experiment_data_sheet_id.toString()}`,
        )
      }
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const CompoundCV = () => {
  const { id } = useParams() as { id: string };
  const { data: compound } = useCompound(id);

  return (
    <div className={styles.topContainer}>
      <div className={styles.moleculeContainer}>
        <Surface style={{ width: "100%", height: "100%" }}>
          {compound && <MoleculeViewer compound={compound} />}
        </Surface>
      </div>

      <div className={styles.tabsContainer}>
        <Surface style={{ width: "100%" }}>
          {compound && <CompoundCVTabs compound={compound} />}
        </Surface>
      </div>

      <div className={styles.bottomContainer}>
        <div className={styles.tableContainer}>
          <Surface style={{ width: "100%", height: "100%" }}>
            {compound && <CompoundCVTableTabs compound={compound} />}
          </Surface>
        </div>
      </div>
    </div>
  );
};

const CompoundCVPage = () => {
  const {
    data: fields,
    isLoading: isFieldsLoading,
    isError: isFieldsError,
    error: fieldsError,
  } = useCompoundFields();

  if (isFieldsLoading) {
    return <Spinner />;
  }

  if (isFieldsError || !fields) {
    return <ErrorPage error={fieldsError} />;
  }

  return <CompoundCV />;
};

export default CompoundCVPage;
