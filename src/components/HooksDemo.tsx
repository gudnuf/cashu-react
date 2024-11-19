import { useState } from "react";
import {
  useActiveWallet,
  useBalance,
  usePendingMintQuotes,
  useWalletManager,
} from "../../lib";
import { formatUnit } from "../util";

const HooksDemo = () => {
  const { receiveLightning, setActiveWallet, activeWallet } = useActiveWallet();
  const { pendingMintQuotes, checkMintQuote } = usePendingMintQuotes();
  const { balance, balanceByWallet, balanceByUnit } = useBalance();
  const { wallets, isLoaded, addMint } = useWalletManager();

  const [mintUrl, setMintUrl] = useState("");

  const handleAddMint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await addMint(mintUrl, ["sat", "usd", "eur"]);
    setMintUrl("");
  };

  const handleSetActiveWallet = (walletKey: string) => {
    const [mintUrl, unit] = walletKey.split("-");
    setActiveWallet(mintUrl, unit);
  };

  const handleReceiveLightning = async (amount: number) => {
    await receiveLightning(amount);
  };

  if (!isLoaded) return <p>Loading...</p>;

  return (
    <>
      <div>
        <h3>Total Balance: {balance}</h3>
        <ul>
          {Object.entries(balanceByUnit).map(([unit, balance]) => (
            <li key={unit}>{formatUnit(unit, balance)}</li>
          ))}
        </ul>
      </div>
      <div>
        <select
          value={activeWallet?.id}
          onChange={(e) => handleSetActiveWallet(e.target.value)}
        >
          {Array.from(wallets.entries()).map(([walletKey, wallet]) => (
            <option key={walletKey} value={walletKey}>
              {wallet.mint.mintUrl} -{" "}
              {formatUnit(wallet.unit, balanceByWallet[wallet.id] || 0)}
            </option>
          ))}
        </select>
      </div>
      <div className="add-mint-container">
        <form onSubmit={handleAddMint}>
          <div className="form-field">
            {/* <label htmlFor="add-mint-url">Mint URL</label> */}
            <input
              type="text"
              id="add-mint-url"
              placeholder="Mint URL"
              value={mintUrl}
              onChange={(e) => setMintUrl(e.target.value)}
            />
          </div>
          <button type="submit">Add Mint</button>
        </form>
      </div>
      <div>
        <button onClick={() => handleReceiveLightning(1000)}>
          Mint {formatUnit(activeWallet?.unit || "", 1000)}
        </button>
      </div>
      <div>
        <h3>Pending Mint Quotes</h3>
        {pendingMintQuotes.map((quote) => (
          <div key={quote.quote}>
            {quote.amount} {quote.unit}{" "}
            <button onClick={() => checkMintQuote(quote.quote)}>Check</button>
          </div>
        ))}
      </div>
    </>
  );
};

export default HooksDemo;
