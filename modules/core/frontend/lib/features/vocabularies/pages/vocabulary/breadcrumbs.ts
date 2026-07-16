import { VocabularyData } from "../../queries/vocabularies";
import { VOCABULARIES_BREADCRUMBS } from "../breadcrumbs";

export const VOCABULARY_BREADCRUMBS = (vocabulary?: VocabularyData | null) => {
  if (!vocabulary) return VOCABULARIES_BREADCRUMBS;
  return [
    ...VOCABULARIES_BREADCRUMBS,
    {
      label: vocabulary.name,
      url: `/core/vocabularies/${vocabulary.id}/items`,
    },
  ];
};
