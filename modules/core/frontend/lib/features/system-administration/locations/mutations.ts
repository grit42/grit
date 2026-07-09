import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "../../entities";
import { Location } from "./types";

export const useCreateLocation = () =>
  useCreateEntityMutation<Location>("/grit/core/locations");
export const useEditLocation = (locationId: string | number) =>
  useEditEntityMutation<Location>("/grit/core/locations", locationId);
export const useDestroyLocation = () =>
  useDestroyEntityMutation(`/grit/core/locations`);
