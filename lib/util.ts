import { MintQuoteResponse } from "@cashu/cashu-ts";
import bolt11Decoder from "light-bolt11-decoder";

export const decodeBolt11 = (bolt11: string) => {
  const { sections, expiry } = bolt11Decoder.decode(bolt11);

  const amountSection = sections.find((s) => s.name === "amount");
  const amountSat = amountSection
    ? Number(amountSection.value) / 1000
    : undefined;
  const expiryUnixSeconds = expiry;

  return { amountSat, expiryUnixSeconds };
};

/**
 * Check if a mint quote or it's invoice has expired
 * @param quote quote to check
 * @returns boolean
 */
export const isMintQuoteExpired = (quote: MintQuoteResponse) => {
  const { expiryUnixSeconds: invoiceExpiry } = decodeBolt11(quote.request);

  /* subtract 15 seconds just so that we underestimate the expiry time, just in case */
  const nowSeconds = Math.floor(Date.now() / 1000) - 15;

  const quoteExpired = quote.expiry && quote.expiry < nowSeconds;
  const invoiceExpired = invoiceExpiry < nowSeconds;

  return quoteExpired || invoiceExpired;
};
