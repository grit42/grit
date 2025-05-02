---
sidebar_label: 'Interface'
sidebar_position: 1
---

# Interface

The grit42 platform pages all include the topbar and toolbar, where users can navigate between sections of the application and perform various actions, such as importing or exporting data and show contextual help.

## Topbar

The topbar is the topmost horizontal band of the interface. It contains links to navigate between sections of the application (1) and the entry point (click the username) to see account settings, switch between light/dark and comfortable/compact display mode and logout (2).

![Topbar showing links to the left and account settings to the right](./assets/navbar_annotated.png)

[More on user settings](./account-settings.md)

## Toolbar

The toolbar shows view-specific actions. It is split in sections, which are always in the same place. It is collapsed by default, showing only icons, but can be expanded to show labels.

![Toolbar](./assets/toolbar_annotated.png)
1. The toolbar, expanded
2. The buttons to perform various actions related to the section of the application
    - This section may be empty
3. The buttons to import and export data from the page, disabled if not applicable
4. The button to expand or collapse the toolbar


## Exporting data from the platform / the data grids

Clicking the export button ( 3) in the picture above) will download a .csv file with the data in the active grid.

The export function will export ALL rows and ALL columns in the active dataset. Hence, if no filter is applied you will get all records from the database!

To reduce the dataset before the export:

1. Add one or more [filters](./data-grids.md#filtering)
2. Reduce the number of [columns displayed in the grid](./data-grids.md#column-visibility)



