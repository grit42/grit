import { useMemo } from "react";
import { BreadcrumbItem, useBreadcrumbs } from "../../app";

export const useAdministrationBreadcrumbs = (items: BreadcrumbItem[]) => {
  useBreadcrumbs(
    useMemo(
      () => [
        { label: "Administration", url: "/core/administration" },
        ...items.map(({ label, url }) => ({
          label,
          url: `/core/administration/${url}`,
        })),
      ],
      [items],
    ),
  );
};
