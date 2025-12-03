# Assays

This software system is designed to support the structured storage and retrieval of compound and assay information in drug discovery,with a strong emphasis on data consistency, reusability, and alignment with the [FAIR data principles](https://www.go-fair.org/fair-principles/) (Findable, Accessible, Interoperable, Reusable).

At the top of the structure are [assay types](./setting-up/assay_types.md), which organize assays into broad scientific categories such as in vivo, in vitro, or biochemical. These categories provide a high-level means of filtering and navigating the data according to the general nature of the biological or experimental system used.

Beneath this, [assay models](./setting-up/assay_models/index.md) define the blueprint for how specific types of assays should be recorded. Each assay model is tailored to a particular experimental approach and includes both a set of [metadata fields](./setting-up/assay_models/metadata.md) and one or more [datasheets](./setting-up/assay_models/data_sheets/index.md). The metadata fields capture essential contextual information—such as organism, target class, or readout type—and are linked to controlled [vocabularies](../general/vocabularies/index.md) to ensure standardized terminology. This standardization is critical for enabling consistent annotation, cross-assay comparison, and automated querying.

The datasheets specified in the assay model define the structure of the experimental data to be collected. This includes the column names, expected data types, and standardized units, ensuring that results are captured in a consistent and interpretable format.

An [assay](./setting-up/assays.md) is then a concrete instance built from an assay model. It represents a specific implementation of the model for a defined purpose—for example, a dose-response study in mice targeting a particular receptor. Since it is based on a specific assay model, the assay inherits both the required metadata structure and datasheet layout. The metadata values are fully defined at the level of the assay and are fixed for all associated experiments.

Within each assay, individual [experiments](./running/experiments.md) represent actual instances of data collection—such as one test of a compound at defined concentrations in a particular run. All experiments within the same assay not only share the same metadata structure but also the same metadata values, since they are part of the same experimental context. The only thing that varies between experiments is the content of the datasheets—the measured or observed data points such as numeric results, categorical outcomes, or textual annotations.

This model enforces a high level of consistency and structure, making it easier to find, integrate, and reuse data across projects and research teams. By linking metadata to controlled vocabularies and clearly separating assay definitions from data instances, the system supports reproducibility, cross-study analysis, and compliance with FAIR data principles.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
