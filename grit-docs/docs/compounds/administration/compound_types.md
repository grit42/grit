---
sidebar_label: 'Compound types'
sidebar_position: 2
---

# Compound types


Before registering any compounds in the grit platform you need to define one (or more) compound types that fit the compounds you want to register. We have added a "Small molecule" default compound type with a minimum of compound properties (metadata).

![The Compounds data showing the compound types](./assets/compound_types.png)

The compound types can be found in the Compounds grid in two places as shown in the screenshot above:

1. As quick filters over the grid
2. As a separate column in the grid in the individual compound row


If the platform has several compound types in the Compounds grid, you can use the compound type column to sort your records 1). In the following you can also see some compound properties (metadata) columns specific to the individual compound types defined in this version of the platform 2).

![The Compounds data sorted by compound types](./assets/compound_types_sorted.png)


The quick filters above the Compounds grid 1) can also be used to filter the compounds. Here we have selected two of the three compounds types and we therefore only see 2) the compound type specific columns relevant for these compound types.


![The Compounds data sorted via quick filter](./assets/compound_types_quick_filter.png)


## Creating compound types

To add a new compound type to the platform do the following:

1. Go to Compounds
2. Click the gears icon in the toolbar (you need the admin role to be able to do so)
4. Click the New button and fill in the appearing form

![Creating new compound types](./assets/compound_types_create.png)


If one of the compound types in the list is selected 4) the specific compound properties belonging to the selected compound type will be highlighted 5) in the compounds properties table on the right.


See below how to add new compound properties to the individual compound types.


## Adding compound type specific properties

To add a new compound property linked to a specific compound type to the platform do the following:

1. Click COMPOUNDS (you need the admin role to be able to do so)
2. Click the gears icon in the toolbar (you need the admin role to be able to do so)
3. Select Metadata
4. Click the New button

![Creating new compound property](./assets/compound_types_prop_create.png)

In the appearing form fill out (at least) all the required fields:

1.  Add a relevant name to the compound property. This will be displayed in the compound grid
2.  Add a unique "Safe name" which can be used to securely identify the property also in the API
3.  Decide if the property should be mandatory. If this switch is on the users need to add information to the field on new compounds
4.  Select the relevant compound type the property should belong to
5.  Select the relevant data type - text, integer etc or a database field like origin, compound etc


![Creating new compound property](./assets/compound_types_prop_create_form.png)

The properties are linked to a specific compound type. Hence, when adding a new compound specific property (as shown above) it's important to ensure the correct compound type is selected in order to link the property to the relevant compound type.

The downstream effects of adding a new property to a specific compound type are, that a new field is shown in the compounds grid on this compound type and that new compound registrations include the property.

![Creating new compound property form](./assets/compound_types_prop_create_form2.png)



