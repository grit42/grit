import { GritColumnDef } from "@grit42/table";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { EntityInfo } from "../../entities";
import { useImporter } from "../importer-context/ImportersContext";
import { WorkbookSheet } from "./spreadsheet-processor/utils";
import { FormFieldDef } from "@grit42/form";
import { LoadSetData } from "../types/load_sets";
import { blockFromFile } from "../utils/load_set_blocks";

export interface PendingLoadSetBlock {
  id: string;
  file: File;
  name: string;
  format: string;
  separator?: string;
  errors?: Record<string, any>;
}

export interface PendingLoadSetBlockPreview {
  sampleData: Record<string, any>[];
  sampleDataColumns: GritColumnDef<Record<string, any>>[];
}

export const LoadSetCreatorSteps = {
  LOAD_FILES: "load_files",
  PROCESS_SPREADSHEETS: "process_spreadsheets",
  INITIALIZE_BLOCKS: "initialize_blocks",
  CREATE_BLOCKS: "create_blocks",
} as const;

type LoadSetCreatorStep =
  (typeof LoadSetCreatorSteps)[keyof typeof LoadSetCreatorSteps];

interface LoadSetCreatorContextValue {
  presets: Record<string, any>;
  entityInfo: EntityInfo;
  setFiles: (files: File[]) => void;
  spreadsheetFiles: File[];
  plainFiles: File[];
  files: File[];
  loadSet: Partial<LoadSetData>;
  setLoadSet: (loadSet: Partial<LoadSetData>) => void;
  blocks: PendingLoadSetBlock[];
  setBlocks: (blocks: PendingLoadSetBlock[]) => void;
  step: LoadSetCreatorStep;
  onSpreadsheetsProcessed: (sheets: WorkbookSheet[]) => void;
  initializeBlocks: () => Promise<void>;
  onCancel: () => void;
  loadSetFields: FormFieldDef[];
  loadSetBlockFields: FormFieldDef[];
}

const defaultValue: LoadSetCreatorContextValue = {
  presets: {},
  entityInfo: {} as EntityInfo,
  setFiles: () => void 0,
  spreadsheetFiles: [],
  plainFiles: [],
  files: [],
  loadSet: {},
  setLoadSet: () => void 0,
  blocks: [],
  setBlocks: () => void 0,
  step: LoadSetCreatorSteps.LOAD_FILES,
  onSpreadsheetsProcessed: () => void 0,
  initializeBlocks: async () => void 0,
  onCancel: () => void 0,
  loadSetFields: [],
  loadSetBlockFields: [],
};

const LoadSetCreatorContext =
  createContext<LoadSetCreatorContextValue>(defaultValue);

type LoadSetCreatorContextProviderProps = PropsWithChildren<
  Pick<
    LoadSetCreatorContextValue,
    "presets" | "entityInfo" | "loadSetFields" | "loadSetBlockFields"
  >
>;

const SPREADSHEET_EXTENSIONS = [
  ".xlsx",
  ".xls",
  ".xlsm",
  ".xlsb",
  ".ods",
  ".fods",
  ".numbers",
];

export const isSpreadSheet = (file: File) =>
  SPREADSHEET_EXTENSIONS.includes(file.name.slice(file.name.lastIndexOf(".")));

const LoadSetCreatorContextProvider = ({
  presets,
  entityInfo,
  loadSetFields,
  loadSetBlockFields,
  children,
}: LoadSetCreatorContextProviderProps) => {
  const { guessLoadSetBlockValues, refineBlocks } = useImporter(
    entityInfo.full_name,
  );
  const [loadSet, setLoadSet] = useState<Partial<LoadSetData>>({
    name: `${entityInfo.full_name}-${new Date().toISOString()}`,
    ...presets,
    entity: entityInfo.full_name,
  });
  const [spreadsheetFiles, setSpreadsheetFiles] = useState<File[]>([]);
  const [plainFiles, setPlainFiles] = useState<File[]>([]);
  const [sheets, setSheets] = useState<WorkbookSheet[]>([]);
  const [blocks, setBlocks] = useState<PendingLoadSetBlock[]>([]);
  const [step, setStep] = useState<LoadSetCreatorStep>(
    LoadSetCreatorSteps.LOAD_FILES,
  );

  const setFiles = useCallback(async (files: File[]) => {
    setSheets([]);
    setBlocks([]);
    const spreadsheetFiles: File[] = [];
    const plainFiles: File[] = [];
    files.forEach((file) =>
      isSpreadSheet(file) ? spreadsheetFiles.push(file) : plainFiles.push(file),
    );
    setSpreadsheetFiles(spreadsheetFiles);
    setPlainFiles(plainFiles);
    setStep(
      spreadsheetFiles.length > 0
        ? LoadSetCreatorSteps.PROCESS_SPREADSHEETS
        : LoadSetCreatorSteps.INITIALIZE_BLOCKS,
    );
  }, []);

  const onSpreadsheetsProcessed = useCallback((sheets: WorkbookSheet[]) => {
    setSheets(sheets);
    setStep(LoadSetCreatorSteps.INITIALIZE_BLOCKS);
  }, []);

  const initializeBlocks = useCallback(async () => {
    const plainBlocks = await Promise.all(
      plainFiles.map((file) =>
        blockFromFile(presets, guessLoadSetBlockValues, file),
      ),
    );
    const sheetBlocks = sheets.map(({ id, name, file, separator }) => ({
      ...presets,
      id,
      name,
      file,
      separator,
      format: "dsv",
    }));
    setBlocks(
      refineBlocks
        ? await refineBlocks([...plainBlocks, ...sheetBlocks])
        : [...plainBlocks, ...sheetBlocks],
    );
    setStep(LoadSetCreatorSteps.CREATE_BLOCKS);
  }, [guessLoadSetBlockValues, plainFiles, presets, refineBlocks, sheets]);

  const onCancel = useCallback(() => {
    setSheets([]);
    setBlocks([]);
    setStep(LoadSetCreatorSteps.LOAD_FILES);
  }, []);

  const files = useMemo(
    () => plainFiles.concat(spreadsheetFiles),
    [plainFiles, spreadsheetFiles],
  );

  return (
    <LoadSetCreatorContext.Provider
      value={{
        presets,
        entityInfo,
        files,
        setFiles,
        spreadsheetFiles,
        plainFiles,
        loadSet,
        setLoadSet,
        blocks,
        setBlocks,
        step,
        onSpreadsheetsProcessed,
        onCancel,
        initializeBlocks,
        loadSetFields,
        loadSetBlockFields,
      }}
    >
      {children}
    </LoadSetCreatorContext.Provider>
  );
};

export const useLoadSetCreatorContext = () => useContext(LoadSetCreatorContext);

export default LoadSetCreatorContextProvider;
