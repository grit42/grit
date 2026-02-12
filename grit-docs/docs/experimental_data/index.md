# Experimental Data

In grit, Experimental data is structured around two core concepts: **assay models** and **experiments**.

**Assay models** serve as blueprints that define how experimental data should be recorded. Each model is tailored to a specific experimental approach and specifies:

- **Data sheet definitions** – a collection of tables and columns that describe the structure and format of your data
- **Metadata definitions** – a collection of fields used to capture contextual information about the experiment

Assay models are organized into **assay types**, which group related models into broad scientific categories such as In Vivo, In Vitro, and Biochemical.

**Experiments** are actual instances of data collection. When you create an experiment, you provide:

- Tabular data that fits into the data sheets defined by the assay model
- Contextual values that populate the metadata fields

**Metadata definitions** represent a standardized set of contextual information that applies across different assay models and experiments. This standardization enhances the findability and interoperability of your experimental data, making it easier to search, compare, and integrate results from different sources.

Once recorded, experimental data can be aggregated into **data tables** for cross-experiment analysis, enabling you to identify trends and draw insights across multiple studies.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
