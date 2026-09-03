import { useParams } from "react-router-dom";
import DataSheetDefinitionColumnsTable from "./DataSheetColumnsTable";

const DataSheetDefinitionColumnsPage = () => {
    const { data_sheet_definition_id } = useParams() as { data_sheet_definition_id: string };

    return <DataSheetDefinitionColumnsTable dataSheetDefinitionId={data_sheet_definition_id} />
}

export default DataSheetDefinitionColumnsPage;
