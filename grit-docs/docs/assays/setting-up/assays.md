---
sidebar_label: 'Assays'
sidebar_position: 4
---

# Assays

The assays are a specific version of the assay models with a certain set of metadata defined.
If an assay model contains a metadata field like "Species" then the assay will have that term defined with specific values. This could be Species = Rat and hence the assay will be using the assay model with rats.

The assays are also where all the experiments - of the assay model with the same defined terms - are stored.

To define a new assay go to Administration -> Assays -> Assays where all the current assays are listed. On each assay the assay type and the assay model they belong to is displayed.

![Assays list](./assets/assays.png)

To create a new assay click the "New" button 4) and click one of the existing assays to edit. The new/edit form appears:

It's mandatory to give the assay a unique name and then select the following:

1) What assay model the assay belongs to - hence what metadata and data sheets to use
2) The publication status - default is draft
3) Select the relevant controlled values for the metadata defined in the assay model

![Edit/new assay](./assets/assays_new.png)



