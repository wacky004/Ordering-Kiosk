'use strict';

const {
  VAT_RATE,
  SENIOR_PWD_RATE,
  POINTS_REDEEM_BLOCK,
  POINTS_REDEEM_VALUE
} = require('./seed-data');

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/** Effective unit price = base price + sum of selected option deltas. */
function unitPrice(basePrice, optionDeltas = []) {
  return round2(basePrice + optionDeltas.reduce((sum, delta) => sum + Number(delta || 0), 0));
}

/**
 * Pure order pricing. All money is VAT-inclusive (Philippines, 12%).
 * Senior/PWD: VAT-exempt plus 20% off the net-of-VAT amount.
 */
function computeOrder(lines, options = {}) {
  const availablePoints = Math.max(0, Math.floor(Number(options.availablePoints) || 0));
  const seniorPwdCount = Math.max(0, Math.floor(Number(options.seniorPwdCount) || 0));
  const requestedPoints = Math.max(0, Math.floor(Number(options.redeemPoints) || 0));

  const pricedLines = lines.map((line) => {
    const deltas = (line.options || []).map((option) => Number(option.delta || 0));
    const unit = unitPrice(Number(line.price), deltas);
    const qty = Math.max(1, Math.floor(Number(line.qty) || 1));
    return { ...line, unit, qty, lineTotal: round2(unit * qty) };
  });

  const subtotal = round2(pricedLines.reduce((sum, line) => sum + line.lineTotal, 0));
  const netOfVat = round2(subtotal / (1 + VAT_RATE));

  let vatableSales = 0;
  let vatAmount = 0;
  let vatExemptSales = 0;
  let seniorDiscount = 0;
  let afterSenior = subtotal;

  if (seniorPwdCount > 0) {
    vatExemptSales = netOfVat;
    seniorDiscount = round2(netOfVat * SENIOR_PWD_RATE);
    afterSenior = round2(netOfVat - seniorDiscount);
  } else {
    vatableSales = netOfVat;
    vatAmount = round2(subtotal - netOfVat);
  }

  const maxRedeemable = Math.max(
    0,
    Math.min(
      Math.floor(availablePoints / POINTS_REDEEM_BLOCK) * POINTS_REDEEM_BLOCK,
      Math.floor(afterSenior / POINTS_REDEEM_VALUE) * POINTS_REDEEM_BLOCK
    )
  );
  let redeemPoints = requestedPoints - (requestedPoints % POINTS_REDEEM_BLOCK);
  if (redeemPoints > maxRedeemable) redeemPoints = Math.max(0, maxRedeemable);
  const pointsDiscount = round2((redeemPoints / POINTS_REDEEM_BLOCK) * POINTS_REDEEM_VALUE);
  const total = round2(Math.max(0, afterSenior - pointsDiscount));
  const pointsEarned = Math.floor(total);

  return {
    lines: pricedLines,
    subtotal,
    vatableSales,
    vatAmount,
    vatExemptSales,
    seniorDiscount,
    seniorPwdCount,
    afterSenior,
    maxRedeemable,
    redeemPoints,
    pointsDiscount,
    total,
    pointsEarned
  };
}

module.exports = { computeOrder, unitPrice, round2, VAT_RATE, SENIOR_PWD_RATE };
