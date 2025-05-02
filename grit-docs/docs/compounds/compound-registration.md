---
sidebar_label: 'Compound registration'
sidebar_position: 2
---

# Compound registration

In order to get some compounds into the database you need to register them. You can do that either by filling in the compound registration form and hence add the compounds one-by-one (singleton registration) or you can import the compounds from a file (bulk registration).

Both methods are described below.

**Note:** before you can register compounds you (or an admin from your organisation) need to create a relevant (matching the compounds you would like to register) [compound type.](./administration/compound_types.md)


## Singleton registration

To manually register a new compound:

1.  Click the "Register compound" button
2.  Select the relevant compound type from the dropdown. (If you miss a compound type you need to add it or ask an admin to do so)

![Compound new](./assets/compound_reg_singleton.png)

A compound registration form appears (here is shown a small molecule compound type to also illustrate the drawing of the structure)

1.  Field to add a structure drawing (see below)
2.  Give the compound a name (it will automatically be given a compound ID as part of the process)
3.  Select the origin from the dropdown
4.  Add a target name. Here added as an illustration of a specific small molecule compound type property defined for the small molecule compound type.

![Compound new form](./assets/compound_reg_singleton_form.png)

When clicking the molecule field a structure drawing tool appear. (**NOTE:** IF you want to register a compound without a structure then leave the field empty and go to [No structure](#no-structure---registering-a-new-compound-without-any-structuremolecule) below)

1.  Draw the relevant structure using the tools on the left side
2.  As you draw the molfile will be shown
3.  As you draw the smiles string will be shown
4.  When finished click "Done"

![Draw structure](./assets/compound_reg_singleton_structure.png)

The structure will now be added to the compound registration form 1). Fill in the rest of the mandatory fields and click "Save" 2).

![Form filled in](./assets/compound_reg_singleton_form2.png)

The compound is now registered in the database and the user is taken to the compound details tab.

1.  The compound number added by the platform as part of the process
2.  Mw calculated by RDKit on the basis of the structure
3.  LogP calculated by RDKit on the basis of the structure
4.  Molecular formula created by RDKit on the basis of the structure

![Singleton reg done](./assets/compound_reg_singleton_success.png)

From here the user can delete the compound again or continue to the [compounds](compounds_grid.md) grid or to [add batches](./compound-details/batches.md#batch-registration---singleton) under this new compound.

## Bulk registration from file

To initiate the compound import process go to the Compounds grid and click the "Import" button 1) and select "import compounds" in the appearing dropdown.

![Compound import](./assets/compound_reg_import.png)

This will take you to the import form:

1.  The name of the load. The platform creates an automatic name, but you can edit. The name can be used to identify this particular load later
2.  What database table the data will be loaded to. Leave as suggested by the platform unless you know what you are doing!
3.  Select the relevant origin of the compounds from the dropdown
4.  Select the compound type. This is important as some compound types have special columns (compound properties) associated with them
5.  Navigate to the compound (sdf) file you want to upload

![Compound import form](./assets/compound_reg_import_form.png)

When the form has been filled in it can look like this.

Go to the button of the screen and click "Start import"

![Compound import form filled](./assets/compound_reg_import_form_filled.png)

The next step is the mapping.

Here you map the relevant columns from the file 1) into the matching columns in the database 2)

![Compound mapping](./assets/compound_reg_import_mapping.png)

The mapping can look something like this:

1.  The molfile field from the file is mapped to the Molecule field in the database
2.  The DRUGBANK ID from the file is mapped to the Name of the compound in the database
3.  The GENERIC_NAME from the file will be added to the Description field
4.  As the file does not contain a relevant origin of the compounds we have here turned the switch "Use a constant value" on and selected a value from the platform list of origins. The origin (here grit42) will be added to all the compounds when they are loaded

![Compound mapping done](./assets/compound_reg_import_mapping_filled.png)

But in this case the import was aborted by the platform.

Two new tabs (Errors, Warnings) 1) appear next to the file data preview and errors are shown.

In this case the issue is that the value (the DRUGBANK ID we mapped to the name column) 2) must to be unique in the database (so we only have one compound with that name) but as these compounds have been loaded before 3) these DRUGBANK ID's already exist.

The user can re-map the Name column to another relevant name/ID in the file if that exist (most compounds have an ID from the producer). If not the file will have to be edited and some relevant and unique name/ID will have to be added to all the compounds.

![Compound import failed - duplicate names](./assets/compound_reg_import_failed.png)


But, when there are no errors and the compounds are loaded into the database an "Import succeeded" form will be shown.

1.  The structures from the file are loaded into the Molecule field
2.  The compounds have automatically been given a grit database ID
3.  The user can here decide to undo the import whereby the whole loadset will be retrieved again

![Compound import succeeded](./assets/compound_reg_import_success.png)


## No structure - registering a new compound without any structure/molecule


To manually register a new compound without a structure:

1.  Click the "Register compound" button
2.  Select the relevant compound type from the dropdown. (If you miss a compound type you need to add it or ask an admin to do so)

![Compound new](./assets/compound_reg_singleton.png)

A compound registration form appears:

1.  Field to add a structure drawing. As we are going to register a compound without a structure skip this field and continue
2.  Give the compound a name (it will automatically be given a compound ID as part of the process)
3.  Select the origin from the dropdown
4.  Click save

![Compound new no struct filled](./assets/compound_reg_singleton_nostruct_form_filled.png)

The compound has now been registered in the database and been assigned a compound number 1).

As the compound doesn't have a structure attached to it the automatically calculated properties (2, 3 and 4) will be empty.


![Compound new no struct success](./assets/compound_reg_singleton_nostruct_success.png)

The compound can be seen in the Compounds grid with the assigned compound number 1). The structure (Molecule) field is naturally empty 2).

![Compound new form](./assets/compound_reg_singleton_nostruct_ingrid.png)





