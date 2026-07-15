import { useBreadcrumbs } from "@grit42/core";
import { useMemo } from "react";
import { COMPOUNDS_BREADCRUMBS } from "../breadcrumbs";
import { CompoundData } from "../../../queries/compounds";

export const useCompoundBreadcrumbs = (compound?: CompoundData | null) =>
  useBreadcrumbs(
    useMemo(
      () =>
        compound
          ? [
              ...COMPOUNDS_BREADCRUMBS,
              { label: compound.number, url: `/compounds/${compound.id}/details` },
            ]
          : COMPOUNDS_BREADCRUMBS,
      [compound],
    ),
  );
