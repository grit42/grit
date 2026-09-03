import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../entities";
import { Origin } from "./types";

export const useCreateOrigin = () =>
  useCreateEntityMutation<Origin>("/grit/core/origins");
export const useEditOrigin = (originId: string | number) =>
  useEditEntityMutation<Origin>("/grit/core/origins", originId);
export const useDestroyOrigin = () =>
  useDestroyEntityMutation(`/grit/core/origins`);
