---
sidebar_label: 'Metadata Definitions'
sidebar_position: 2
description: 'Contextual information for experimental data'
---

# Metadata Definitions

Metadata Definitions enable tracking contextual information about your experimental data.

Metadata Definitions are based on [Vocabularies](/docs/vocabularies/index.md), to facilitate consistent data entry and support Findability, Interoperability and Reusability of your experimental data.

Metadata Definitions represent precise contextual information that may be relevant to include in some Experiments, and are used to group or differentiate Experiments based on Experiment Metadata Values.

Metadata Definitions are not required to store experimental data, but they play a key role in the analysis features of grit. It is strongly recommended using them diligently to make full use of the capabilities of grit.

## Managing Metadata Definitions

:::note
Managing Metadata Definitions requires the **Administrator** or **AssayAdministrator** role.
:::

Metadata Definitions can be managed in the Assay Model administration section, which can be accessed as follows:
1) Go to the Assay Models menu
2) Click the gears icon top right in the toolbar

![Assay Models administration](../assets/assay_models_administration.png)

### Creating Metadata Definitions

To create Metadata Definitions, navigate to the Assay Model administration, then:

1) Select the *Metadata* tab
2) Click the New button

![Metadata definitions](./assets/metadata_definitions.png)

1) Provide a name and an optional description
2) Provide a safe name
    - The safe name is a machine friendly name for integration with external systems
    - A suggestion will be provided based on the name, click to apply it
3) Select the **Vocabulary** to control accepted values
4) Click **Save**

![Edit metadata definition](./assets/edit_metadata_definition.png)

### Modifying Metadata Definitions

:::note
Metadata Definitions that are already in use, either in an Assay Model or in an Experiment, cannot be modified.
:::

To modify an existing Metadata Definition, click it in the list, make your changes and click **Save**.
