---
sidebar_label: 'Using Vocabularies'
sidebar_position: 2
---

# Using Vocabularies

The **Vocabularies** feature allows you to enforce consistent data entry by restricting field inputs to a predefined list of valid terms. This is especially useful in data collection workflows such as assay metadata, compound or batch properties, and other structured forms.

When configuring a field that supports data type selection, you can bind it to an existing vocabulary. Once bound:

- A dropdown (picker) will appear in the user interface for selecting vocabulary items.
- During data import, any value in a column mapped to a vocabulary-bound field will be validated against the vocabulary. If a value is not found, an error will be raised and the import will fail for that row.

This ensures that only standardized, validated terms are captured across your datasets.

## Configuring Form Fields

To bind a form field to a vocabulary, select it as **Data Type** when configuring the field.

For example, when defining a column in an assay model data sheet, locate the **Data Type** field.

![The form defining an assay data sheet column](./assets/vocabulary_in_data_sheet_column.png)

Select the appropriate vocabulary in the list of available data types.

![The list of available data types](./assets/vocabulary_in_data_sheet_column_form.png)

Once configured, users entering data into that field will only be able to select from the permitted vocabulary terms.

:::warning
Modifying fields that already contain data may lead to data loss or validation errors. Changes to field type or constraints can cause existing values to become invalid or removed. Always review data dependencies before making changes.
:::

## Exporting Vocabularies

You can export vocabulary items for use in other systems or for review. On a vocabulary detail page, click the **Export** button in the toolbar. The exported CSV file will include all vocabulary items and their descriptions, supporting integration with external tools, regulatory submissions, or ontology mapping workflows.

![Vocabulary detail view Export highlighted](./assets/export_vocabulary_items.png)
