import { useContext } from "react";
import { CashuContext } from "../../contexts";

export const useWalletManagerContext = () => {
  const context = useContext(CashuContext);

  if (!context) {
    throw new Error("useWalletManager must be used within a CashuProvider");
  }

  return context.walletManager;
};
