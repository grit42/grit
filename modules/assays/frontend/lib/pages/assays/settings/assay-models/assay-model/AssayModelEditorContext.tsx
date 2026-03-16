import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { AssayModelData } from "../../../../../queries/assay_models";

interface AssayModelEditorContextValue {
  assayModel: AssayModelData | null;
  dangerousEditMode: boolean;
  canEdit: boolean;
  setDangerousEditMode: Dispatch<SetStateAction<boolean>>;
}

const defaultValue: AssayModelEditorContextValue = {
  assayModel: null,
  dangerousEditMode: false,
  canEdit: true,
  setDangerousEditMode: () => void 0,
};

export const AssayModelEditorContext =
  createContext<AssayModelEditorContextValue>(defaultValue);

const AssayModelEditorContextProvider = ({
  children,
  assayModel,
}: PropsWithChildren<{ assayModel: AssayModelData }>) => {
  const [dangerousEditMode, setDangerousEditMode] = useState(false);

  const contextValue = useMemo(
    () => ({
      assayModel,
      setDangerousEditMode,
      dangerousEditMode,
      canEdit:
        dangerousEditMode ||
        assayModel.publication_status_id__name !== "Published",
    }),
    [dangerousEditMode, assayModel],
  );

  return (
    <AssayModelEditorContext.Provider value={contextValue}>
      {children}
    </AssayModelEditorContext.Provider>
  );
};

export const useAssayModelEditorContext = () => {
  return useContext(AssayModelEditorContext);
};

export default AssayModelEditorContextProvider;
