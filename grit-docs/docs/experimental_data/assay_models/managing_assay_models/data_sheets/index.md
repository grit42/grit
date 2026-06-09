# Managing Data Sheets

Data Sheets describe the shape of your experimental data. They define tables and columns with names, description and data types. The columns also define the form fields for recording data manually and importing from files.

Data Sheets of an Assay Model can be viewed and modified under the **Data Sheets** tab.

![Data Sheet](./assets/assay_models_datasheet.png)

1) Data Sheets tab
2) The tabs for each Data Sheet of the Assay Model
3) Name and description of the Data Sheet
4) Whether this Data Sheet contains result data
    - Toggle on to make this Data Sheet available in **Data Tables**
5) The list of columns in this Data Sheet

## Creating a Data Sheet

![Create Data Sheet](./assets/create_data_sheet.png)

1) Click the **+ New Sheet** tab
2) Provide a name and an optional description
3) Toggle on to mark as Result
    - Only Result Data Sheets are available in **Data Tables**
4) Click **Save**


## Creating a Data Sheet Column

On the appropriate Data Sheet, click the **New** button above the list of columns and:

![Create Data Sheet Column](./assets/create_data_sheet_column.png)

1) Provide a name
2) Provide a safe name
    - The safe name is a machine friendly name for integration with external systems
    - A suggestion will be provided based on the name, click to apply it
3) Toggle on to mark this column as required
4) Select the appropriate data type
5) Click **Save**

:::tip
Pay attention to the name and safe name given to the columns. Setting at least one of them to a value matching the header in your file will enable the system to preconfigure the mapping when importing data, which can save a lot of time on data set with a lot of columns.
:::

:::note
There is a maximum of 250 columns per Data Sheet.
:::

Creating data sheets manually can be a lengthy process. It is possible to create Data Sheets from files containing experimental data.
