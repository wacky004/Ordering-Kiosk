/**
 * Pricing rules shared by the mobile demo. Mirrors src/pricing.js exactly:
 * VAT-inclusive (12%), Senior/PWD = VAT-exempt + 20% off net, loyalty points.
 */
export const VAT_RATE = 0.12;
export const SENIOR_RATE = 0.2;
export const POINT_BLOCK = 100;
export const POINT_VALUE = 10;

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function unitPrice(basePrice, options = []) {
  return round2(Number(basePrice) + options.reduce((sum, o) => sum + Number(o.delta || 0), 0));
}

export function computeOrder(lines, { availablePoints = 0, redeemPoints = 0, seniorCount = 0 } = {}) {
  const priced = lines.map((line) => {
    const unit = unitPrice(line.price, line.options || []);
    const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
    return { ...line, unit, qty, lineTotal: round2(unit * qty) };
  });

  const subtotal = round2(priced.reduce((sum, line) => sum + line.lineTotal, 0));
  const net = round2(subtotal / (1 + VAT_RATE));

  let vatableSales = 0;
  let vatAmount = 0;
  let vatExemptSales = 0;
  let seniorDiscount = 0;
  let afterSenior = subtotal;

  if (seniorCount > 0) {
    vatExemptSales = net;
    seniorDiscount = round2(net * SENIOR_RATE);
    afterSenior = round2(net - seniorDiscount);
  } else {
    vatableSales = net;
    vatAmount = round2(subtotal - net);
  }

  const maxRedeemable = Math.max(
    0,
    Math.min(
      Math.floor(availablePoints / POINT_BLOCK) * POINT_BLOCK,
      Math.floor(afterSenior / POINT_VALUE) * POINT_BLOCK
    )
  );
  let redeem = redeemPoints - (redeemPoints % POINT_BLOCK);
  if (redeem > maxRedeemable) redeem = Math.max(0, maxRedeemable);
  const pointsDiscount = round2((redeem / POINT_BLOCK) * POINT_VALUE);
  const total = round2(Math.max(0, afterSenior - pointsDiscount));

  return {
    lines: priced,
    subtotal,
    vatableSales,
    vatAmount,
    vatExemptSales,
    seniorDiscount,
    maxRedeemable,
    redeemPoints: redeem,
    pointsDiscount,
    total,
    pointsEarned: Math.floor(total),
  };
}
