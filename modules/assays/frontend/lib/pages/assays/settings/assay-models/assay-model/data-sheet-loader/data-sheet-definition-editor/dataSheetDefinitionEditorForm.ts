import { FormFieldDef } from "@grit42/form";
import { EntityFormFieldDef, EntityPropertyDef } from "@grit42/core";

export interface DataSheetDefinition {
  id: number;
  assay_model_id: number;
  assay_model_id__name: string;
  name: string;
  result?: boolean | null;
  description?: string | null;
  sort?: number | null;
}

export interface DataSheetColumnDefinition {
  id: number;
  assay_data_sheet_definition_id: number;
  assay_data_sheet_definition_id__name: string;
  name: string;
  safe_name: string;
  required?: boolean | null;
  data_type_id: number;
  data_type_id__name: string;
  unit_id?: number | null;
  unit_id__name?: string | null;
  description?: string | null;
  sort?: number | null;
}

export interface DataSheetDefinitionFull extends DataSheetDefinition {
  columns: DataSheetColumnDefinition[];
}

export interface DataSetDefinition {
  id: number;
  name: string;
  description?: string | null;
}

export interface DataSetDefinitionFull extends DataSetDefinition {
  sheets: DataSheetDefinitionFull[];
}

export const DATA_SHEET_COLUMN_FIELDS: (FormFieldDef | EntityFormFieldDef)[] = [
  {
    name: "name",
    display_name: "Name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
  },
  {
    name: "safe_name",
    display_name: "Safe name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    description: "",
    type: "text",
    limit: undefined,
    required: false,
  },
  {
    name: "sort",
    display_name: "Sort",
    description: "",
    type: "integer",
    limit: 4,
    required: false,
  },
  {
    name: "required",
    display_name: "Required",
    description: "",
    type: "boolean",
    limit: undefined,
    required: true,
  },
  {
    name: "data_type_id",
    display_name: "Data type",
    description: "",
    type: "entity",
    limit: 8,
    required: true,
    entity: {
      full_name: "Grit::Core::DataType",
      name: "DataType",
      path: "grit/core/data_types",
      primary_key: "id",
      primary_key_type: "integer",
      column: "data_type_id",
      display_column: "name",
      display_column_type: "string",
    },
  },
  {
    name: "unit_id",
    display_name: "Unit",
    description: "",
    type: "entity",
    limit: 8,
    required: false,
    entity: {
      full_name: "Grit::Core::Unit",
      name: "Unit",
      path: "grit/core/units",
      primary_key: "id",
      primary_key_type: "integer",
      column: "unit_id",
      display_column: "abbreviation",
      display_column_type: "string",
    },
  },
];


export const DATA_SHEET_FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    description: "",
    type: "text",
    limit: undefined,
    required: false,
  },
  {
    name: "result",
    display_name: "Result",
    description:
      "Make this data visible in the detailed view of this model's assays",
    type: "boolean",
    limit: undefined,
    required: false,
  },
  {
    name: "sort",
    display_name: "Sort",
    description: "",
    type: "integer",
    limit: 4,
    required: false,
  },
];

export const DATA_SHEET_COLUMN_COLUMNS: EntityPropertyDef[] = [
  {
    name: "name",
    display_name: "Name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
    unique: false,
    default_hidden: false,
  },
  {
    name: "safe_name",
    display_name: "Safe name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
    unique: true,
    default_hidden: false,
  },
  {
    name: "description",
    display_name: "Description",
    description: "",
    type: "text",
    limit: undefined,
    required: false,
    unique: false,
    default_hidden: false,
  },
  {
    name: "sort",
    display_name: "Sort",
    description: "",
    type: "integer",
    limit: 4,
    required: false,
    unique: false,
    default_hidden: false,
  },
  {
    name: "required",
    display_name: "Required",
    description: "",
    type: "boolean",
    limit: undefined,
    required: true,
    unique: false,
    default_hidden: false,
  },
  {
    name: "data_type_id__name",
    display_name: "Data type",
    description: "",
    type: "entity",
    limit: 8,
    required: true,
    unique: false,
    entity: {
      full_name: "Grit::Core::DataType",
      name: "DataType",
      path: "grit/core/data_types",
      primary_key: "id",
      primary_key_type: "integer",
      column: "data_type_id",
      display_column: "name",
      display_column_type: "string",
    },
    default_hidden: false,
  },
  {
    name: "unit_id__abbreviation",
    display_name: "Unit",
    description: "",
    type: "entity",
    limit: 8,
    required: false,
    unique: false,
    entity: {
      full_name: "Grit::Core::Unit",
      name: "Unit",
      path: "grit/core/units",
      primary_key: "id",
      primary_key_type: "integer",
      column: "unit_id",
      display_column: "abbreviation",
      display_column_type: "string",
    },
    default_hidden: false,
  },
];
