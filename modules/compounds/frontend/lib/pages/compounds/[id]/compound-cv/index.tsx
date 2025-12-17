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
  Button,
  ButtonGroup,
} from "@grit42/client-library/components";
import { useParams, useLocation, useNavigate, redirect} from "react-router-dom";
import {
  CompoundData,
  useCompound,
  useCompoundFields,
} from "../../../../queries/compounds";
import { AsyncMoleculeViewer } from "../../../../components/MoleculeViewer";
import styles from "./compoundCv.module.scss";
import { useState, useCallback, useMemo } from "react";
import { Table, useSetupTableState, Filter } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import {
  BatchData,
  useCompoundTypeBatchesColumns,
  useInfiniteBatchesOfCompound,
} from "../../../../queries/batches";
import { useInfiniteEntityData } from "@grit42/core";


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

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      <li>Number: {compound.number}</li>
      <li>ID: {compound.id}</li>
      <li>Name: {compound.name}</li>
      <li>Compound type: {compound.compound_type_id__name}</li>
      {GenFieldsExt?.map((field) => (
        <li>
          {field.display_name}: {compound[field.name]}
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
  // const {data: CalcPropFields} = useCompoundFields(compound?.compound_type_id)
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {CalcPropFields?.map((field) => (
        <li>
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
        {
          key: "characterization",
          name: "Characterization",
          panel: <div>Characterization Content</div>,
        },
      ]}
    />
  );
};

const MolFileButtons = ({ compound }: { compound: CompoundData }) => {
  // const [state, setState] = useState(0);
  return (
    <ButtonGroup>
      <Button
        size="tiny"
        color="secondary"
        onClick={() => alert(compound.molecule)}
      >
        Show Molfile
      </Button>
      <Button size="tiny" onClick={() => alert("3D View not implemented yet")}>
        View in 3D
      </Button>
    </ButtonGroup>
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
          key: "batches",
          name: "Batches",
          panel: <CompoundCVBatchTable compound={compound} />,
        },
        {
          key: "experiments",
          name: "Experiments",
          panel: <CompoundCVExperimentTable compound={compound} />,
        },
        {
          key: "Molecular Descriptors",
          name: "Molecular Descriptors",
          panel: <CompoundCVMolecularDescriptorsTable compound={compound} />,
        },
        {
          key: "Atomic Descriptors",
          name: "Atomic Descriptors",
          panel: <div></div>,
        },
      ]}
    />
  );
};

const CompoundCVBatchTable = ({ compound }: { compound: CompoundData }) => {
  const { data: columns } = useCompoundTypeBatchesColumns(
    compound?.compound_type_id,
    {
      enabled: !!compound,
    },
  );
  const tableColumns = useTableColumns<BatchData>(columns);

  const tableState = useSetupTableState<BatchData>(
    "batches-list",
    tableColumns,
    {
      saveState: true,
      settings: {
        enableColumnDescription: true,
        enableColumnOrderReset: true,
      },
    },
  );

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteBatchesOfCompound(
    compound.id,
    tableState.sorting,
    tableState.filters,
  );

  const getRowId = useCallback((row: BatchData) => row.id.toString(), []);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table<BatchData>
      loading={isFetching && !isFetchingNextPage}
      header="Batches"
      data={flatData}
      tableState={tableState}
      getRowId={getRowId}
      rowActions={undefined}
      onRowClick={undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};


const CompoundCVExperimentTable = ({
  compound,
}: {
  compound: CompoundData;
}) => {

  const navigate = useNavigate();

  // const { pathname } = useLocation();
  const tableColumns = useTableColumns([
    {
      name: "value",
      display_name: "Value",
      default_hidden: false,
      required: false,
      type: "numeric",
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
  const tableState = useSetupTableState(
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
    useInfiniteEntityData(
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
      header="Experiment Overview"
      // getRowId={getRowId} // error but it works with a list of strings
      data={flatData}
      tableState={tableState}
      rowActions={undefined}
      // onRowClick={( row ) => navigate(`/assays/experiments/${row.original.experiment_id}/sheets/${row.original.experiment_data_sheet_id}`)}
      onRowClick={( row ) => navigate(`/assays/experiments/${row.original.experiment_id.toString()}/sheets/${row.original.experiment_data_sheet_id.toString()}`)}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const CompoundCVMolecularDescriptorsTable = ({
  compound,
}: {
  compound: CompoundData;
}) => {

  const tableColumns = useTableColumns([
    {
      name: "molweight",
      display_name: "MW",
      default_hidden: false,
      required: false,
      type: "decimal",
      unique: false,
    },
    {
      name: "logp",
      display_name: "LogP",
      default_hidden: false,
      required: false,
      type: "decimal",
      unique: false,
    },
    {
      name: "hba",
      display_name: "Hydrogen Bond Acceptor Count",
      default_hidden: false,
      required: false,
      type: "decimal",
      unique: false,
    },
    {
      name: "hbd",
      display_name: "Hydrogen Bond Donor Count",
      default_hidden: false,
      required: false,
      type: "decimal",
      unique: false,
    },
  ]);

  const tableState = useSetupTableState(
    "molecular-descriptors-list",
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
    useInfiniteEntityData(
      "grit/compounds/compounds",
      tableState.sorting,
      tableState.filters,
      {
        compound_id: compound.id,
        scope: "molecular_descriptors",
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
      header="Experiment Overview"
      data={flatData}
      tableState={tableState}
      rowActions={undefined}
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

  // return (
  //  <div className={styles.container}>
  //     <Surface style={{ width: "100%" }}>
  //       {compound && <MoleculeViewer compound={compound} />}
  //       {compound && <CompoundCVTabs compound={compound} />}
  //       {/* {compound && <CompoundCVTable compound={compound} id={id} />} */}
  //       {compound && <CompoundCVTableTabs compound={compound} />}
  //       {/* {compound && (
  //         <CompoundCVExperimentDetails
  //           compound={compound}
  //           experimentDataSheetID={"116276"}
  //         />
  //       )} */}
  //       {/* {compound && <GetAllExperimentsIds />}
  //       {compound && <ExperimentDataSheets experimentId={"113794"} />} */}
  //     </Surface>
  //   </div>
  // );
  return (
    <div className={styles.container}>
      <div className={styles.moleculeContainer}>
        <Surface style={{ width: "100%" }}>
          {compound && <MoleculeViewer compound={compound} />}
          {compound && <MolFileButtons compound={compound} />}
        </Surface>
      </div>

      <div className={styles.tabsContainer}>
        <Surface style={{ width: "100%" }}>
          {compound && <CompoundCVTabs compound={compound} />}
        </Surface>
      </div>

      <div className={styles.tableContainer}>
        <Surface style={{ width: "100%" }}>
          {compound && <CompoundCVTableTabs compound={compound} />}
        </Surface>
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
