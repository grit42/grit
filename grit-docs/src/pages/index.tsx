import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Open Source Scientific Data Management
        </Heading>
        <p className="hero__subtitle">
          Bring clarity and structure to your preclinical research data.
          Configure metadata for your therapeutic modalities, define
          standardized templates for your experimental data, and confidently capture data
          aligned with FAIR principles using controlled vocabularies.
        </p>
        <p className="hero__subtitle">
          grit helps ensure consistency, traceability, and interoperability from
          the start (and retrospectively).
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/intro">
            Get started!
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title={`Scientific data management`}
      description="Documentation for the grit scientific data management system"
    >
      <HomepageHeader />
    </Layout>
  );
}
