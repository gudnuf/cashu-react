import { useState } from "react";
import { useActiveWallet, useBalance, useWalletManager } from "../../lib";

const HooksDemo = () => {
  const { balance, balanceByKeysetId } = useBalance();
  const { addMint, wallets, setActiveWallet, isLoaded, activeUnit } =
    useWalletManager();
  const { receiveLightning } = useActiveWallet();

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
      <p>Balance: {balance}</p>
      <div>
        <select onChange={(e) => handleSetActiveWallet(e.target.value)}>
          {Array.from(wallets.entries()).map(([walletKey, wallet]) => (
            <option key={walletKey} value={walletKey}>
              {wallet.mint.mintUrl} - {balanceByKeysetId[wallet.keysetId] || 0}{" "}
              {wallet.unit}
            </option>
          ))}
        </select>
      </div>
      <div>
        <form onSubmit={handleAddMint}>
          <div>
            <label htmlFor="add-mint-url">Mint URL</label>
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
          Receive 1000 {activeUnit}
        </button>
      </div>
    </>
  );
};

export default HooksDemo;
