---
sidebar_label: 'Data grids'
sidebar_position: 2
---

# Data grids

Data grids are omnipresent throughout the application. For the most part, these grids support sorting and filtering, as well as column visibility settings. Some grids also support ordering columns and/or rows by drag'n'drop.

![Compounds data grid](./assets/data_grid_annotated.png)
1. The button to show and apply filters, if available
2. The button to open the column visibility settings, if available
3. A column header, which can be clicked to sort the column or dragged to move columns around, if available
4. Information about the number of records currently loaded or, if not filters are set, the total number of records

## Filtering

Data grids can be filtered by multiple criteria, combined by a logical AND.

![DM domain data grid filtered by substructure and Mw](./assets/data_grid_filtered.png)
1. The filtered column
2. The comparator
3. The value the column is compared with
4. Enable/disable condition
5. Delete condition
6. Add a condition

### Comparator types

#### Generic:
- Is empty
- Is not empty

#### Text:
- Is
- Is not
- Contains - (Contains 100 => GRIT10050 AND GRIT50100)
- Does not contain
- Like - (Like %100% => GRIT10050; Like %100 => GRIT50100)
- In list
- Not in list

#### Number and dates:
- Equal to
- Not equal to
- Greater than
- Less than
- Greater than or equal to
- Less than or equal to


## Sorting

Data grids can be sorted by ascending or descending order. Clicking a column header will cycle between unsorted, ascending order, descending order.

![The Compounds data grid, sorted by Mw](./assets/data_grid_sorted.png)
1. The Compounds data grid, sorted by Mw

It is possible to sort multiple columns by holding shift while clicking the column header. The rows are then sorted in the same order as the columns have been initially added to the sort.

## Column visibility

In some grids, column visibility can be configured to show only some columns. The configured visibility settings are only available for the machine on which it was configured.

![DM domain column visibility settings](./assets/data_grid_column_visibility.png)
1. The button to open the column visibility settings
2. The button to turn on/off the visibility of the column
3. A displayed column
4. A hidden column


## Column ordering

In some grids, the column order can be configured by dragging and dropping columns to new places in the grid. The configured order is only available for the machine on which it was configured.
