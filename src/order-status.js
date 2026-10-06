'use strict';

const { STATUS_FLOW, STATUS_LABELS } = require('./seed-data');

/** Valid state machine transitions (ignoring role). */
const TRANSITIONS = {
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: []
};

/** Which transitions each operational role may perform. manager/admin may do any valid one. */
const ROLE_ALLOWED = {
  user: { received: ['cancelled'] },
  kitchen: { received: ['preparing'], preparing: ['ready'] },
  cashier: { ready: ['completed'], received: ['cancelled'], preparing: ['cancelled'] }
};

function isStatus(status) {
  return Object.prototype.hasOwnProperty.call(TRANSITIONS, status);
}

function canTransition(role, from, to) {
  if (!isStatus(from) || !isStatus(to)) return false;
  if (!TRANSITIONS[from].includes(to)) return false;
  if (role === 'manager' || role === 'admin') return true;
  const allowed = ROLE_ALLOWED[role] || {};
  return (allowed[from] || []).includes(to);
}

function nextStatus(status) {
  const index = STATUS_FLOW.indexOf(status);
  if (index === -1 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
}

module.exports = {
  TRANSITIONS,
  ROLE_ALLOWED,
  STATUS_FLOW,
  STATUS_LABELS,
  isStatus,
  canTransition,
  nextStatus
};
