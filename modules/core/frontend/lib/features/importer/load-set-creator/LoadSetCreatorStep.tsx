import {
  LoadSetCreatorSteps,
  useLoadSetCreatorContext,
} from "./LoadSetCreatorContext";
import FilesLoader from "./file-loader";
import SpreadsheetProcessor from "./spreadsheet-processor";
import LoadSetBlocks from "./load-set-blocks";
import LoadSetBlocksInitializer from "./load-set-block-initializer";

const LoadSetCreatorStep = () => {
  const { step, spreadsheetFiles, onSpreadsheetsProcessed, onCancel } =
    useLoadSetCreatorContext();

  if (step === LoadSetCreatorSteps.LOAD_FILES) {
    return <FilesLoader />;
  }

  if (step === LoadSetCreatorSteps.PROCESS_SPREADSHEETS) {
    return (
      <SpreadsheetProcessor
        onCancel={onCancel}
        files={spreadsheetFiles}
        onProcessed={onSpreadsheetsProcessed}
      />
    );
  }

  if (step === LoadSetCreatorSteps.INITIALIZE_BLOCKS) {
    return <LoadSetBlocksInitializer />;
  }

  return <LoadSetBlocks />;
};

export default LoadSetCreatorStep;
