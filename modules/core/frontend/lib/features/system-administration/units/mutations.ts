import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../entities";
import { Unit } from "./types";

export const useCreateUnit = () =>
  useCreateEntityMutation<Unit>("/grit/core/units");
export const useEditUnit = (unitId: string | number) =>
  useEditEntityMutation<Unit>("/grit/core/units", unitId);
export const useDestroyUnit = () =>
  useDestroyEntityMutation(`/grit/core/units`);
