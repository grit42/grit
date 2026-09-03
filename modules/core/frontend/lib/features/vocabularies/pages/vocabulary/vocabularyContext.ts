import { createContext, useContext } from "react";
import { VocabularyData } from "../../queries/vocabularies";

export interface VocabularyContextValue {
  vocabulary: VocabularyData;
  canAdmin: boolean;
}

const defaultValue: VocabularyContextValue = {
  vocabulary: {} as VocabularyData,
  canAdmin: false,
};

const VocabularyContext = createContext(defaultValue);

export const useVocabularyContext = () => useContext(VocabularyContext);

export default VocabularyContext;
