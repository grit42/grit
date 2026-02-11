---
sidebar_label: 'Assay Metadata'
sidebar_position: 2
---

# Assay Metadata

Assay Metadata enable tracking contextual information around your experimental data, such as the Bacteria Strain used or the Site the experiment was run in, and provide an easy way to group related experiments.

Assay Metadata are based on [Vocabularies](/docs/general/vocabularies/index.md).

Assay Metadata are not required, but it is strongly recommended using them to improve the Findability and Interoperability. Assay Metadata are also relevant in [Data Tables](/docs/data-tables/assay-data-sheet-columns.md), where they can be used to determine aggregated Experiments.

## Managing Assay Metadata

:::note
Managing Assay Metadata requires the **Administrator** or **AssayAdministrator** role.
:::

Assay Metadata can be managed in the Assay Model administration section, which can be accessed as follows:
1) Go to the Assay Models menu
2) Click the gears icon top right in the toolbar

![Going to Assay Models administration](./assets/assay_models_administration.png)

### Creating Assay Metadata

To create Assay Metadata, navigate to the Assay Model administration, then:

1) Select the *Metadata* tab
2) Click the New button

![Assay metadata](./assets/assay_metadata.png)

1) Provide a name and an optional description
2) Provide a safe name
    - The safe name is a machine friendly name for integration with external systems
    - A suggestion will be provided based on the name, click to apply it
3) Select the **Vocabulary** to control accepted values
4) Click **Save**

![Edit assay metadata](./assets/edit_assay_metadata.png)

### Modifying Assay Metadata

:::note
Assay Metadata that are already in use, either in an Assay Model or in an Experiment, cannot be modified.
:::

To modify an existing Assay Metadata, click it in the list, make your changes and click **Save**.

## Assay Metadata Templates

Assay Metadata Templates enable setting many Metadata Values at once when creating Experiments, by providing groups of values that are often used together.

### Creating Assay Metadata Templates

To create Assay Metadata Templates, navigate to the Assay Model administration, then:

1) Select the *Metadata templates* tab
2) Click the New button

![Assay metadata templates](./assets/assay_metadata_templates.png)

1) Provide a name and an optional description
2) Select values for some or all **Assay Metadata**
4) Click **Save**

![Edit assay metadata templates](./assets/edit_metadata_templates.png)

### Modifying Assay Metadata Templates

To modify an existing Assay Metadata Template, click it in the list, make your changes and click **Save**.
