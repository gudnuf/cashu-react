import { CashuWallet } from "@cashu/cashu-ts";

export const useReceiveLightningPayment = () => {
  const generateInvoice = async (wallet: CashuWallet, amount: number) => {
    const mintQuote = await wallet.createMintQuote(amount);

    console.log(mintQuote);
  };

  return { generateInvoice };
};
