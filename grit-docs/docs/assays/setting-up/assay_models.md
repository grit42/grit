---
sidebar_label: 'Assay models'
sidebar_position: 3
---

# Assay models

Assay models are the templates for the assays. The assay models are linked to an assay type and contains
some details, potentially controlled metadata fields and one or several data sheets with plot(s). The data sheets are data reporting forms, hence they define format of the data - the columns - you will be uploading as results from the experiments under the assay.

The assay models are stored under Administration -> Assays -> Models.

The Assay models overview also show what assay type the model is linked to 3) and what the current status is 4).


![Vocabularies items](./assets/assay_models.png)

Opening an assay model (clicking it once) enables diving in to the underlying information stored on each model:

1) Details
2) Metadata
3) Data sheets

## Details

The Details tab contains the name and description as well as the assay type 1) and publication status 2). These values can also be updated here whereby a Save button will appear.

![Assay models details](./assets/assay_models_details.png)

## Metadata

The metadata tab lists the metadata fields currently added to the assay model. To add new metadata fields or remove the current ones click the "Edit" button 1).

![Assay model metadata](./assets/assay_models_metadata.png)

The appearing metadata form displays the metadata currently available in the platform 2) as well as the ones already added to the assay model 1). In the screen below 3) there are no more metadata fields available to select/add to the assay model. (To add new metadata fields to the platform go to [Vocabularies](../administration/vocabularies.md)).



![Metadata select](./assets/assay_models_metadata_select.png)


## Data sheets

1) Data sheets tab
2) Adding a new sheet
3) Name of the data sheet
4) Turn the switch on if you want the experiment data to be shown (together with data from the other experiments in this assay) on the assay level
5) Adding new columns


![Data sheets](./assets/assay_models_datasheets.png)

1) Column name
2) Safe name
3) Sort - order of the columns in the sheet
4) Select the relevant data type (see below)
5) Required - meaning the field will become required when uploading data

![Data sheets columns](./assets/assay_models_datasheets_columns.png)

Selecting the correct/relevant data type for the data sheet columns.

When adding a new column to the data sheet the user have to select the data type from a dropdown showing the following list:

1) Name
2) Is entity - meaning it's linked to a table (like Compounds) in the database
3) Table name - the name of the table an entity field belongs to
4) Description - hopefully helpful to enable the user to select the relevant datatype


![Data sheets columns datatypes](./assets/assay_models_datasheets_columns_datatypes.png)

## Creating a new assay model

Adding a new assay model:


![Vocabularies items](./assets/assay_models_new.png)


