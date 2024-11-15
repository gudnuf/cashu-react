export const formatUnit = (unit: string, amount: number) => {
  switch (unit) {
    case "sat":
      return `${amount.toLocaleString()} sats`;
    case "usd":
      return `$${Math.floor(amount / 100).toFixed(2)}`;
    case "eur":
      return `${Math.floor(amount / 100).toFixed(2)} €`;
    default:
      return `${amount} ${unit}`;
  }
};
