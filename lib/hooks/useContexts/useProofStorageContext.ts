import { useContext } from "react";
import { CashuContext } from "../../contexts";

export const useProofStorageContext = () => {
  const value = useContext(CashuContext);

  if (!value) {
    throw new Error(
      "useProofStorageContext must be used within a CashuProvider"
    );
  }

  const { proofStorage } = value;

  return proofStorage;
};
