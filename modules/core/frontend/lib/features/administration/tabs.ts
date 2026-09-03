import { useMemo } from "react";
import { HeaderTab, useTabs } from "../../app";

export const useAdministrationTabs = (items: HeaderTab[]) => {
  useTabs(
    useMemo(
      () =>
        items.map(({ label, url }) => ({
          label,
          url: `/core/administration/${url}`,
        })),
      [items],
    ),
  );
};
