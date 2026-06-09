import { useQuery } from "@grit42/api";
import {
  PendingLoadSetBlock,
  PendingLoadSetBlockPreview,
} from "../LoadSetCreatorContext";

export const useBlockSampleData = (
  block: PendingLoadSetBlock,
  sampleData: (
    block: PendingLoadSetBlock,
  ) => Promise<PendingLoadSetBlockPreview>,
) => {
  return useQuery({
    queryKey: ["blockSampleData", block.id, block.separator, block.format],
    queryFn: (): Promise<PendingLoadSetBlockPreview> => sampleData(block),
  });
};
