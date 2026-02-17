---
sidebar_label: 'Managing vocabularies'
sidebar_position: 1
description: Add, edit and delete vocabularies under the Vocabularies tab
---

# Managing Vocabularies

Vocabularies in *grit* are visible and available for use by all users across the platform to support consistent data entry. However, only users with the roles of **Administrator** or **VocabularyAdministrator** have permissions to manage vocabularies. This includes creating new vocabularies, editing or deleting existing ones, and managing individual vocabulary items such as adding, editing, or removing terms.

## Creating a Vocabulary

To create a new vocabulary, navigate to the **Vocabularies** tab and click the **New** button above the vocabulary list.

![The Vocabularies tab](./assets/vocabularies.png)

In the form that appears, provide a **Name** and an optional **Description**, then click **Save**.

:::info
Vocabulary names must be unique across the system.
:::

![The form to create a new vocabulary](./assets/new_vocabulary.png)

After saving, you'll be redirected to the vocabulary detail page, where you can edit the name and description, and begin adding vocabulary items.

![The vocabulary detail page](./assets/vocabulary_details.png)

The **Name** and **Description** are displayed in the data type selector when configuring data points (such as assay data sheet columns or compound properties), so they should be concise, informative, and easy to recognize.

:::tip
Use a consistent naming format to keep vocabularies organized and easier to locate when configuring fields.
:::

## Managing Vocabularies

Vocabularies can be updated at any time, and deleted as long as they are not currently in use.

### Editing a Vocabulary

To edit a vocabulary:

1. Click the vocabulary in the list to open its detail form.
2. Make the necessary changes.
3. Click **Save**.

![An edited vocabulary](./assets/edit_vocabulary.png)

### Deleting a Vocabulary

A vocabulary can be deleted **only if it is not referenced in any field**. You can delete a vocabulary by opening its detail page and clicking **Delete** in the left pane.

![Vocabulary details with delete button highlighted](./assets/delete_vocabulary.png)

## Adding Items to a Vocabulary

Once a vocabulary has been created, it can be populated with items either manually or in bulk via CSV import.
To begin, select a vocabulary from the list under the **Vocabularies** tab to open its detail page.

### Adding Items Manually

To add an item manually, click the **New** button above the item list.

![Vocabulary details with New button highlighted](./assets/vocabulary_add_item_manually.png)

In the form that appears, enter a **Name** (required) and an optional **Description**, then click **Save**.

![New Vocabulary Item form](./assets/vocabulary_add_item_manually_form.png)

You’ll be returned to the vocabulary detail page, where you can continue adding additional items as needed.

:::info
Items must be unique within a vocabulary.
:::

### Importing Items in bulk

To import a list of items, click the **Import** button in the toolbar and follow the standard import procedure.

![Vocabulary details with Import button highlighted](./assets/vocabulary_import_items.png)

:::tip
If the column headers in your dataset are **Name** and **Description**, the corresponding fields will be mapped automatically. For best results, ensure your CSV uses clear, consistent naming and avoid duplicates. Each item name must be unique within a vocabulary.
:::

After the import, click **Go to Vocabulary** to return to the detail page and review the newly added items.

![Successful Import of vocabulary items](./assets/vocabulary_import_items_succeeded.png)

Imported data is grouped into a **Load Set**, which can be viewed under the **Load Sets** tab. If needed, you can **undo** a load set to remove all items imported in that batch—useful for correcting mistakes or cleaning up test data.

![Vocabulary item load sets](./assets/vocabulary_load_sets.png)

## Managing Vocabulary Items

Vocabulary items can be updated at any time, and deleted as long as they are not currently in use.

### Editing a Vocabulary Item

To edit a vocabulary item, click the item in the list.

![Vocabulary item list with Item highlighted](./assets/edit_vocabulary_item.png)

Make your changes and click **Save**.

![An edited Vocabulary Item](./assets/edit_vocabulary_item_form.png)

### Deleting Vocabulary Items

Vocabulary items can be deleted if they are not referenced in any data. You can delete an item by opening its detail page and clicking **Delete**.

![Vocabulary Item detail with Delete highlighted](./assets/delete_vocabulary_item.png)

Vocabulary Items can also be deleted by clicking the **Trash** icon at the end of the item's row in the vocabulary table. Selecting multiple items using the checkboxes at the start of each row, then clicking the **Trash** icon on any selected row to delete all selected items at once.

![Delete Vocabulary Items](./assets/delete_vocabulary_items.png)
