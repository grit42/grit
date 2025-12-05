import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useAssayColumns,
  usePublishedAssays,
} from "../../queries/assays";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { useAssayTypeColumns, useAssayTypes } from "../../queries/assay_types";
import {
  useAssayModelColumns,
  usePublishedAssayModels,
} from "../../queries/assay_models";
import { useEffect, useMemo, useState } from "react";
import { EntityData } from "@grit42/core";
import { useNavigate } from "react-router-dom";
import CogIcon from "@grit42/client-library/icons/Cog";
import { useToolbar } from "@grit42/core/Toolbar";

interface AssayTypesTableProps {
  state: [number[], React.Dispatch<React.SetStateAction<number[]>>];
}

const getRowId = (data: EntityData) => data.id.toString();

const AssayTypesTable = ({ state }: AssayTypesTableProps) => {
  const [selectedTypes, setSelectedTypes] = state;
  const { data: columns } = useAssayTypeColumns(undefined, {
    select: (data) =>
      data
        .filter((c) => c.name === "name")
        .map((c) => ({ ...c, defaultColumnSize: 200 })),
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("assay-types-list", tableColumns, {
    settings: {
      disableFilters: true,
      disableVisibilitySettings: true,
      disableColumnReorder: true,
    },
  });
  const { data, isLoading, isError, error } = useAssayTypes();

  const emphasizedTypes = useMemo(
    () =>
      selectedTypes.reduce(
        (acc, id) => ({ ...acc, [id.toString()]: true }),
        {},
      ),
    [selectedTypes],
  );

  return (
    <Table
      disableFooter
      header="Assay types"
      getRowId={getRowId}
      emphasizedRows={emphasizedTypes}
      onRowClick={(row, e) => {
        if (e.ctrlKey) {
          setSelectedTypes((prev) => {
            if (prev.includes(row.original.id))
              return prev.filter((id) => id !== row.original.id);
            return [...prev, row.original.id];
          });
        } else {
          setSelectedTypes((prev) => {
            if (prev.length === 1 && prev[0] === row.original.id) return [];
            return [row.original.id];
          });
        }
      }}
      tableState={tableState}
      data={data}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
    />
  );
};

interface AssayModelsTableProps {
  selectedTypes: number[];
  state: [number[], React.Dispatch<React.SetStateAction<number[]>>];
}

const AssayModelsTable = ({ state, selectedTypes }: AssayModelsTableProps) => {
  const [selectedModels, setSelectedModels] = state;

  const { data: columns } = useAssayModelColumns(undefined, {
    select: (data) =>
      data
        .filter((c) => c.name === "name")
        .map((c) => ({ ...c, defaultColumnSize: 200 })),
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("assay-models-list", tableColumns, {
    settings: {
      disableFilters: true,
      disableVisibilitySettings: true,
      disableColumnReorder: true,
    },
  });

  const { data, isLoading, isError, error } = usePublishedAssayModels();

  const emphasizedModels = useMemo(
    () =>
      selectedModels.reduce(
        (acc, id) => ({ ...acc, [id.toString()]: true }),
        {},
      ),
    [selectedModels],
  );

  const modelsOfSelectedTypes = useMemo(
    () =>
      selectedTypes.length
        ? data?.filter(({ assay_type_id }) =>
            selectedTypes.includes(assay_type_id),
          )
        : data,
    [selectedTypes, data],
  );

  useEffect(() => {
    if (selectedTypes.length) {
      const oldModels = data
        ?.filter(
          ({ id, assay_type_id }) =>
            selectedModels.includes(id) &&
            !selectedTypes.includes(assay_type_id),
        )
        .map(({ id }) => id);
      if (oldModels?.length) {
        setSelectedModels((prev) => prev.filter((p) => !oldModels.includes(p)));
      }
    }
  }, [data, selectedTypes]);

  return (
    <Table
      disableFooter
      header="Assay models"
      getRowId={getRowId}
      emphasizedRows={emphasizedModels}
      onRowClick={(row, e) => {
        if (e.ctrlKey) {
          setSelectedModels((prev) => {
            if (prev.includes(row.original.id))
              return prev.filter((id) => id !== row.original.id);
            return [...prev, row.original.id];
          });
        } else {
          setSelectedModels((prev) => {
            if (prev.length === 1 && prev[0] === row.original.id) return [];
            return [row.original.id];
          });
        }
      }}
      tableState={tableState}
      data={modelsOfSelectedTypes}
      loading={isLoading}
      noDataMessage={
        isError
          ? error
          : selectedTypes.length
            ? "No models for the selected types"
            : "No published assay models"
      }
    />
  );
};

interface AssaysTableProps {
  selectedTypes: number[];
  selectedModels: number[];
}

const AssaysTable = ({ selectedTypes, selectedModels }: AssaysTableProps) => {
  const navigate = useNavigate();
  const { data: columns } = useAssayColumns(undefined, {
    select: (data) =>
      data.filter(({ name }) => name !== "publication_status_id__name"),
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("assays-list", tableColumns);

  const { data, isLoading, isError, error } = usePublishedAssays(
    tableState.sorting,
    tableState.filters,
  );

  const assaysOfSelectedTypesAndModels = useMemo(() => {
    if (data && (selectedTypes.length || selectedModels.length)) {
      return data.filter(({ assay_type_id, assay_model_id }) => {
        const inSelectedTypes = selectedTypes.length
          ? selectedTypes.includes(assay_type_id)
          : true;
        const inSelectedModels = selectedModels.length
          ? selectedModels.includes(assay_model_id)
          : true;
        return inSelectedTypes && inSelectedModels;
      });
    }
    return data;
  }, [selectedTypes, selectedModels, data]);

  return (
    <Table
      header="Assays"
      tableState={tableState}
      data={assaysOfSelectedTypesAndModels}
      loading={isLoading}
      onRowClick={({ original }) => navigate(original.id.toString())}
      noDataMessage={
        isError
          ? error
          : selectedTypes.length || selectedModels.length
            ? "No assays for the selected types and models"
            : "No published assays"
      }
    />
  );
};

// const AssaysSideBar = () => {
//   const {
//     data: types,
//     isLoading: isTypesLoading,
//     isError: isTypesError,
//     error: typesError,
//   } = useAssayTypes();
//   const {
//     data: models,
//     isLoading: isModelsLoading,
//     isError: isModelsError,
//     error: modelsError,
//   } = useAssayModels();

//   const modelsByTypes = useMemo(() => {
//     if (!types) return [];
//     return types.map((t) => ({
//       ...t,
//       models: models?.filter((m) => m.assay_type_id === t.id) ?? [],
//     }));
//   }, [models, types]);

//   if (isTypesLoading || isModelsLoading) {
//     return <Spinner />;
//   }

//   if (isTypesError || !types || isModelsError || !models) {
//     return <ErrorPage error={typesError ?? modelsError} />;
//   }

//   return (
//     <div
//       style={{
//         display: "grid",
//         gridTemplateRows: "45px 1fr",
//         overflow: "auto",
//       }}
//     >
//       <h1>Assays</h1>
//       <Surface
//         style={{
//           height: "100%",
//           overflow: "auto",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "stretch",
//         }}
//       >
//         {modelsByTypes.map((t) => (
//           <div
//             key={t.id}
//             style={{
//               paddingBlockEnd: "calc(var(--spacing))",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             <span style={{ fontWeight: "bolder" }}>{t.name}</span>
//             {t.models.map((m) => (
//               <span
//                 key={m.id}
//                 style={{
//                   paddingInlineStart: "calc(var(--spacing) * 2)",
//                   paddingBlockEnd: "calc(var(--spacing) * 0.5)",
//                   fontWeight: "bold",
//                 }}
//               >
//                 {m.name}
//               </span>
//             ))}
//           </div>
//         ))}
//       </Surface>
//     </div>
//   );
// };

const AssaysPage = () => {
  const selectedTypesState = useState<number[]>([]);
  const selectedModelsState = useState<number[]>([]);
  const registerToolbarAction = useToolbar();
  const navigate = useNavigate();

  useEffect(() => {
    return registerToolbarAction({
      actions: [
        {
          id: "ASSAY_SETTINGS",
          icon: <CogIcon />,
          label: "Assay settings",
          requiredRoles: [
            "Administrator",
            "AssayAdministrator",
          ],
          onClick: () =>
            navigate("/assays/settings")
        },
      ],
    });
  }, [ navigate, registerToolbarAction ]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "max-content max-content 1fr",
        height: "100%",
        width: "100%",
        gap: "1rem",
      }}
    >
      <AssayTypesTable state={selectedTypesState} />
      <AssayModelsTable
        state={selectedModelsState}
        selectedTypes={selectedTypesState[0]}
      />
      <AssaysTable
        selectedTypes={selectedTypesState[0]}
        selectedModels={selectedModelsState[0]}
      />
    </div>
  );
};

const AssaysPageWrapper = () => {
  const {
    isLoading: isAssayTypeColumnLoading,
    isError: isAssayTypeColumnError,
    error: assayTypeColumnError,
  } = useAssayTypeColumns();
  const {
    isLoading: isAssayModelColumnLoading,
    isError: isAssayModelColumnError,
    error: assayModelColumnError,
  } = useAssayModelColumns();
  const {
    isLoading: isAssayColumnLoading,
    isError: isAssayColumnError,
    error: assayColumnError,
  } = useAssayColumns();

  if (
    isAssayTypeColumnLoading ||
    isAssayModelColumnLoading ||
    isAssayColumnLoading
  )
    return <Spinner />;
  if (isAssayTypeColumnError || isAssayModelColumnError || isAssayColumnError)
    return (
      <ErrorPage
        error={
          assayTypeColumnError ?? assayModelColumnError ?? assayColumnError
        }
      />
    );
  return <AssaysPage />;
};

export default AssaysPageWrapper;
