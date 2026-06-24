---
sidebar_label: 'Compound CV'
sidebar_position: 2
---

# Compound CV

The **Compound CV** is the *curriculum vitae* of a compound: a single page that gathers what the compound is together with everywhere it has been measured.
The page is split into two parts: a collapsible **sidebar** describing the compound, and a **results table** listing every published result the compound appears in.

<!-- ![The Compound CV page with its sidebar and results table](./assets/compound_cv.png) -->

## The sidebar

The sidebar summarizes the compound itself:

- **(1) Structure** – the rendered molecule. Open the menu in the corner of the structure to **Copy SMILES to clipboard** or **Copy Molfile to clipboard**.
- **(2) General Information** – core registration data: ID, Number, Name and Compound type, followed by the available structure identifiers (Molecular formula, SMILES, InChI and InChI key). Long values are truncated with an **Expand text** / **Collapse text** toggle.
- **(3) Calculated Properties** – structure-derived values where they exist: Molecular weight, LogP, hydrogen-bond donors (HBD) and acceptors (HBA).
- **(4) Collapse button** – collapses the sidebar to a thin strip to give the table more room. Click it again to expand the sidebar back.

The **General Information** and **Calculated Properties** sections are independently collapsible; click a section header (▲ / ▼) to fold it away.

## The table

The table lists every individual numeric result that has been recorded for the compound and is located by:

- **Assay model** – the assay model the experiment belongs to
- **Experiment** – the experiment in which the value was measured
- **Data Sheet** – the result data sheet the value was recorded on
- **Column** – the name of the column holding the value
- **Value** – the measured numeric value
- **Unit** – the unit of the value, when the column defines one

Because a compound can be referenced in many experiments and in several columns within a single data sheet, the same compound typically produces several rows.

### What is included

The table only shows a result when **all** of the following hold:

- It comes from a **result** data sheet.
- The value lives in a **numeric** column (integer, decimal or float).
- Both the **experiment** and its **assay model** are **Published**.
