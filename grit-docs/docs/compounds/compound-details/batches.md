---
sidebar_label: 'Compound batches'
sidebar_position: 2
---

# Compound batches

As default batch information does not contain much metadata apart from the Batch name given by the system and the name the batch received by the producer 1). In order not to lose the link to the compound in question the Batches table also display some compound metadata 2).


![The batches grid](./assets/compound_details_batch.png)



If more metadata is required on the batches of certain modalities then these metadata fields can be configured (added) in the same way as [extra compound properties](./../administration/compound_types.md#creating-compound-types) are added. Below one new 1) small molecule 2) batch property has been added:



![Adding a new batch property to a small molecule batch](./assets/compound_details_batch_prop.png)


Resulting in a new batch column appearing in the Batches list 1):


![The Batch grid with a new batch prop column](./assets/compound_details_batch2.png)

## Batch registration - singleton

To add a new batch under the selected compound click the New batch button 1) and fill in the appearing form. The number of fields in the batch registration form will depend on the amount of batch properties 2) defined for the compound type in question.

![The Batch grid showing new batch button](./assets/compound_batch_registration.png)


For the small molecule compound type we added the NewBatchMetaData field above which will therefore be present in the register batch form below 1).
The batches - the physical versions of the compounds - will often also have a name from the producer. In order to secure the link back to the producer of the batch, the name field is mandatory. After clicking the Save button, a uniqueness check on this name field is performed to prevent the same batch to be registered twice.


![The Batch registration form](./assets/compound_batch_registration2.png)


## Batch registration - import file

The platform also offers the possibility to import a list of batches from a .csv file.

If a CRO or another external lab produced the batches they will often attach a list with the batch information and a link to the relevant compound (the compound name).

To import a list of batches go to the Compounds grid (OR the Batches tab under Compound Details) and click the Import button and select Import batches 1).

![The compound grid showing batch import](./assets/compound_batch_import.png)

Fill in the appearing form

1. Select the relevant compound type
2. Add a .csv file or copy/paste a text with the batch information. Note: Each row needs a compound identifier!
3. Click Start import

![The batch import form](./assets/compound_batch_import2.png)

The importer will now read the file, check that it fits the requirements and then open the mapping form where the user needs to map the columns (the data) in the csv file/provided text to the relevant/matching fields in the database.

1. In the table on the right side is a preview of the data (in the csv file)
2. The batch name (here the name column) in the provided data need to be mapped to the Name field in the grit database by selecting it in the dropdown menu. Similarly, Description field in the database is mapped to the description column in the csv.
3. This mapping links the batch information to the relevant (Note: need to exist) compound in the database. The number column from the csv file containing the compound identifier is mapped to the Compound field. "Find by" is the column in the compound table in the database where the system should look for a match, in this case it should lookup the number provided by grit. But other identifiers like the compound name provided by the producer can also be used.
4. The csv file does NOT contain any origin of the batches. But origin is a mandatory field in the batch table in the database. Therefore we use the switch "Use a constant value" and select grit42 from the database origin lookup table (Origins can be added under -> Administration -> General -> Origins -> Records by pressing the New button). Now all batch records will be assigned origin = grit42

When all relevant data from the csv file has been mapped and all mandatory fields in the database have been filled click the Continue button.


![The batch data mapping](./assets/compound_batch_import_mapping.png)

The importer will now check whether the compound number (the compounds) already exist in the database in order to be able to link the batches to the compounds. Then it will check that the batch names does NOT already exist to ensure uniqueness and finally that the data in the file has a format the matches the relevant fields in the database.

If the importer finds any errors in the file it will be reported in the front end for the user to see and correct.

If everything goes well the system will show an "Import succeeded" report.

1.  All the imported batches have been assigned an internal grit batch number
2.  (and 3) The compound GRIT0000855 was assigned two new batches
4. All the new batches have been assigned grit42 as origin


![The batch import succeeded](./assets/compound_batch_import_succeeded.png)

