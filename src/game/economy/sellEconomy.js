export const SELL_ECONOMY = Object.freeze({
  version: 1,
  baseRefundRate: 0.70,
  minimumRefund: 1,
  refundRounding: 'floor'
});

export function getDefenseInvestment(defense, upgradeSpend = 0) {
  const baseCost = Math.max(0, Number(defense?.cost ?? 0));
  const upgrades = Math.max(0, Number(upgradeSpend ?? 0));
  return baseCost + upgrades;
}

export function getSellRefund(defense, upgradeSpend = 0) {
  const investment = getDefenseInvestment(defense, upgradeSpend);
  if (investment <= 0) return 0;

  return Math.max(
    SELL_ECONOMY.minimumRefund,
    Math.floor(investment * SELL_ECONOMY.baseRefundRate)
  );
}

export function getSellPreview(defense, upgradeSpend = 0) {
  const investment = getDefenseInvestment(defense, upgradeSpend);
  const refund = getSellRefund(defense, upgradeSpend);

  return Object.freeze({
    defenseId: defense?.id ?? null,
    investment,
    refund,
    retainedValue: investment === 0 ? 0 : Number((refund / investment).toFixed(3)),
    refundRate: SELL_ECONOMY.baseRefundRate
  });
}
