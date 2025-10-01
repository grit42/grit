---
sidebar_label: "Assay Data Sheet columns"
sidebar_position: 2
---

# Assay Data Sheet columns

Data tables **Assay Data Sheet columns** display experimental data. **Assay Data Sheet columns** are selected from [Assay Models](../assays/setting-up/assay_models.md) and aggregate data from **Published** experiments belonging to the **Assay Model**. **Assays** filter can be configured to aggregate data from specific **Assays**.

**Assay Data Sheet columns** are managed under the **Columns** > **Assay columns** tab (1).
Click **Add entity attribute** (2) to add a column displaying an entity attribute to the data table.

![Assay data sheet columns tab](./assets/add_assay_column.png)

In the list, select the assay data sheet column to add by clicking the row.

![Add entity attribute column](./assets/select_assay_column.png)

In the form, configure the column details and click **Save**.

1. The name of the column displayed in the table.
2. A machine-friendly name, only alphanumerical characters and underscores (**\_**).
3. An optional sort indication used to define the default position of the column, a lower value is closer to the start.
4. The [aggregation method](#aggregation-methods) that should be used to produce a single value when there are multiple results for the entity.
5. [Assay filters](#assays-filter) to select a specific subset of assays to get results from.

![Add assay column form](./assets/add_assay_column_form.png)

:::info
Suggestion for updating the _Safe name_ of the column will be displayed below the input when making changes to the _Name_. Click it to accept the suggested value.
:::

Assay data sheet columns can be cloned by clicking an existing column, then clicking **Clone** (1).

![Edit data sheet column](./assets/edit_assay_column.png)

Assay data sheet columns can be removed under **Columns** > **Assay columns** by selecting one or more rows in the table clicking the **Trash** icon at the end of one of the selected rows.

![Removing data sheet columns](./assets/remove_data_sheet_column.png)

## Aggregation methods

Available aggregation methods depend on the data type of the assay data sheet column, as follows:

- All data types:
  - Comma separated list: all values are concatenated in a single value, separated by commas.
  - Latest: shows the value that was updated last
  - Count: the total number of values for the column/entity pair
- Number:
  - Average
  - Minimum
  - Maximum
  - Standard deviation
- Date and Datetime
  - Minimum
  - Maximum
- Boolean
  - AND: true if all values are true
  - OR: true if any value is true

## Assays filter

Assay data sheet columns data is aggregated from **Published Experiments** of the corresponding **Assay model**. The Assays filter can be used to target specific **Assays** of the model. If **Assays** are selected, only data from **Experiments** belonging to the selected **Assays** will be aggregated. If no **Assays** are selected, all **Experiments** from all **Assays** of the **Assay Model** are used.

This enables grouping data from **Assays** that may differ only by some **Metadata**, such as the site or lab the **Assay** was run in.
