import { useBreadcrumbs } from "@grit42/core";

export const COMPOUNDS_BREADCRUMBS = [{ label: "Compounds", url: "/compounds" }];
export const useCompoundsBreadcrumbs = () => useBreadcrumbs(COMPOUNDS_BREADCRUMBS);
