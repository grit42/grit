---
sidebar_label: 'Loading data'
sidebar_position: 2
---

# Loading assay results

When you want to add data (type or load) to an assay you firstly need to open that assay.

You will land on the details tab of the experiment:

1) The values of the two controlled metadata fields in this assay (Bacteria, Bacteria strain) is highlighted
2) The details is shown and can be edited here
3) Next step is to click the prepared data sheet and load data.

![New Experiment ready](./assets/experiment_new_done.png)

On the data sheet tab is the columns of the data sheet - as it is designed in the assay model - displayed 1).

2) Click the "New" button to add new data records manually
3) OR click the "Import" button to start the import of a data file

![New or import data](./assets/experiment_new_data.png)

To add data manually you simply need to:

1) Select the relevant compound from the dropdown
2) Type the value

and click "Save".

![New Experiment ready](./assets/experiment_new_data_add.png)

After clicking the "Import" button the file import form appears.

The Name and Entity fields are automatically populated. Just leave them as is.

Then select the relevant values:

1) Origin - who made the data
2) Separator - the delimiter for the CSV file, when a file is added the system will attempt to guess the separator used and fill this field
3) Experiment - the experiment the data set will be loaded into
4) Experiment data sheet - the data sheet the data set will be loaded into
5) Data - the actual data that will be loaded, can be added by selecting or dropping a file, or pasting or typing manually

![Experiment data import](./assets/experiment_new_data_import.png)

The platform will import the file, display the content of the file and prepare for the mapping of columns in the file with fields in the data sheet in the database (If the headers in the file match the name of the fields in the database an auto mapping happens):

1) Compound field in data sheet
2) "Find by" - to ensure the results in the file are linked to the correct compounds in the database - and that the compounds exists and are written correctly in the file - the platform will look for a match between the compounds in the file and the compounds in the database. As a user specify what column in the database to use for the matching.
3) The result column in the data sheet
4) The content of the data file

![Experiment data mapping](./assets/experiment_new_data_import_mapping.png)

1) Compound column from the file mapped to the Compound field in the data sheet
2) Dropdown from the "Find by" field. Selecting the "Number" column in the database to use for the matching
3) The "Compound" column in the file mapped to the Compound field


![Data import. Compound find by](./assets/experiment_new_data_import_mapping2.png)

Mapping is done and the "Validate data set" button is enabled. Click the button to continue!


![Data import mapping done](./assets/experiment_new_data_import_mapping_done.png)

The file has now been imported and the content (the data) from the file is displayed in the columns in the relevant data sheet in the assay/experiment.

After review the user can now regret and click "Undo import" or "Go to experiment" 1) to continue and work with the data in the experiment.

![Import succeeded](./assets/experiment_new_data_import_succeeded.png)

In the experiment there are several possibilities to work with the data.

1) Go to the "Plots" tab and visualise the data via [plots](./plots.md).
2) Filter the data to analyse
3) Change the number of columns displayed. If an experiment has many columns it may make sense for some investigations to remove (hide) some of them for clarity.


![Data in experiment](./assets/experiment_new_data_imported.png)
