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
import { useParams } from "react-router-dom";
import {
  CompoundData,
  useCompound,
  useCompoundFields,
} from "../../../../queries/compounds";
import { AsyncMoleculeViewer } from "../../../../components/MoleculeViewer";
import styles from "./compoundCv.module.scss";
import { useState } from "react";

// const CompoundDetails = () => {
//   const canCrud = useHasRoles([
//     "Administrator",
//     "CompoundAdministrator",
//     "CompoundUser",
//   ]);
//   const { id } = useParams() as { id: string };
//   const { data: compound } = useCompound(id);
//   const { data: fields } = useCompoundFields(compound?.compound_type_id);

//   const compoundTypeFields = useMemo(
//     () =>
//       fields
//         ?.filter(
//           (f) =>
//             (f.compound_type_id === null ||
//               f.compound_type_id === compound?.compound_type_id) &&
//             f.name !== "molecule",
//         )
//         .map((f) =>
//           ["compound_type_id", "number"].includes(f.name)
//             ? { ...f, disabled: true }
//             : { ...f, disabled: !canCrud },
//         ) ?? [],
//     [fields, compound],
//   );

//   const [showGeneralInfo, setShowGeneralInfo] = useState(false);
//   const [showCalcProps, setShowCalcProps] = useState(false);
//   const [showCharacterization, setShowCharacterization] = useState(false);

//   const OrderGeneralInfo = [
//     "Number",
//     "Name",
//     "Molecular formula",
//     "inchi",
//     "inchi key",
//   ];
//   const OrderGeneralInfoLC = OrderGeneralInfo.map((s) => s.toLowerCase());
//   const AllowedGeneralInfo = new Set(OrderGeneralInfoLC);

//   const OrderCalculatedProperties = [
//     "MW",
//     "logP",
//     "Hydrogen Bond Donor Count",
//     "Hydrogen Bond Acceptor Count",
//   ];
//   const OrderCalculatedPropertiesLC = OrderCalculatedProperties.map((s) =>
//     s.toLowerCase(),
//   );
//   const AllowedCalculatedProperties = new Set(OrderCalculatedPropertiesLC);

//   function filteredFields(allowedSet: Set<string>, orderArray: string[]) {
//     const filtered = (compoundTypeFields ?? [])
//       .filter((f) => allowedSet.has(String(f.display_name).toLowerCase()))
//       .sort(
//         (a, b) =>
//           orderArray.indexOf(String(a.display_name).toLowerCase()) -
//           orderArray.indexOf(String(b.display_name).toLowerCase()),
//       );
//     return filtered.map((f) => (
//       <li key={f.name}>
//         {f.display_name}: {compound?.[f.name] ?? ""}
//       </li>
//     ));
//   }

//   const generalInfoItems = useMemo(
//     () => filteredFields(AllowedGeneralInfo, OrderGeneralInfoLC),
//     [compound, compoundTypeFields],
//   );
//   const CalculatedPropertiesInfoItems = useMemo(
//     () =>
//       filteredFields(AllowedCalculatedProperties, OrderCalculatedPropertiesLC),
//     [compound, compoundTypeFields],
//   );

//   const GeneralInfoToggle = () => setShowGeneralInfo((v) => !v);
//   const CalcPropToggle = () => setShowCalcProps((v) => !v);
//   const CharacterizationToggle = () => setShowCharacterization((v) => !v);

//   return (
//     <div className={styles.container}>
//       <Surface style={{ width: "100%" }}>
//         {compound?.molecule && (
//           <div className={styles.moleculeContainer}>
//             <AsyncMoleculeViewer molfile={compound.molecule} />
//           </div>
//         )}

//         <button onClick={GeneralInfoToggle} aria-expanded={showGeneralInfo}>
//           General Information
//         </button>
//         {showGeneralInfo && (
//           <div className={styles.generalInfo}>
//             <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
//               {generalInfoItems}
//             </ul>
//           </div>
//         )}

//         <button onClick={CalcPropToggle} aria-expanded={showCalcProps}>
//           Calculated Properties
//         </button>

//         {showCalcProps && (
//           <div className={styles.calcProps}>
//             <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
//               {CalculatedPropertiesInfoItems}
//             </ul>
//           </div>
//         )}

//         <button
//           onClick={CharacterizationToggle}
//           aria-expanded={showCharacterization}
//         >
//           Characterization
//         </button>
//       </Surface>
//     </div>
//   );
// };

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

const GeneralInfo = ({ compound }: { compound: CompoundData }) => {
  return (
    <ul>
      <li>Name: {compound.name}</li>
      <li>Compound number: {compound.number}</li>
      <li>Compound type: {compound.compound_type_id__name}</li>
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
          panel: <div>Calculated Properties Content</div>,
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

const CompoundCV = () => {
  const { id } = useParams() as { id: string };
  const { data: compound } = useCompound(id);

  return (
    <div className={styles.container}>
      <Surface style={{ width: "100%" }}>
        {compound && <MoleculeViewer compound={compound} />}
        {compound && <CompoundCVTabs compound={compound} />}
      </Surface>
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
