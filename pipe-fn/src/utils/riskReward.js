export function calculateRiskReward({
  direction,
  entryPrice,
  stopLoss,
  takeProfit,
}) {
  const entry = Number(entryPrice);
  const stop = Number(stopLoss);
  const target = Number(takeProfit);

  if (![entry, stop, target].every(Number.isFinite)) return null;
  if (entry <= 0 || stop <= 0 || target <= 0) return null;

  const risk = direction === "SELL" ? stop - entry : entry - stop;
  const reward = direction === "SELL" ? entry - target : target - entry;

  if (risk <= 0 || reward <= 0) return null;

  return reward / risk;
}

export function formatRiskReward(value, digits = 2) {
  const ratio = Number(value);
  if (!Number.isFinite(ratio) || ratio <= 0) return "—";
  return `1:${ratio.toFixed(digits)}`;
}

export function getRiskReward(trade) {
  return (
    calculateRiskReward({
      direction: trade.direction,
      entryPrice: trade.entryPrice ?? trade.entry_price,
      stopLoss: trade.stopLoss ?? trade.stop_loss,
      takeProfit: trade.takeProfit ?? trade.take_profit,
    }) ??
    (Number.isFinite(Number(trade.riskReward ?? trade.risk_reward))
      ? Number(trade.riskReward ?? trade.risk_reward)
      : null)
  );
}
