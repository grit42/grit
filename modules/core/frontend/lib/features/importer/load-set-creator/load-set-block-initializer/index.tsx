import { LoadingPage } from "@grit42/client-library/components";
import { useLoadSetCreatorContext } from "../LoadSetCreatorContext";
import { useEffect } from "react";

const LoadSetBlocksInitializer = () => {
  const { initializeBlocks } = useLoadSetCreatorContext();

  useEffect(() => {
    initializeBlocks();
  }, [initializeBlocks]);

  return <LoadingPage message="Initialising..." />;
};

export default LoadSetBlocksInitializer;
