'use strict';

const { db } = require('./db');

/** Returns { [menuItemId]: [ {id, name, type, required, options:[{id,name,delta,is_default}]} ] } */
function getOptionsForItems(itemIds) {
  const ids = [...new Set(itemIds.map(Number).filter(Boolean))];
  if (ids.length === 0) return {};

  const placeholders = ids.map(() => '?').join(',');
  const groups = db
    .prepare(
      `SELECT * FROM option_groups WHERE menu_item_id IN (${placeholders}) ORDER BY sort_order, id`
    )
    .all(...ids);

  let options = [];
  if (groups.length > 0) {
    const groupPlaceholders = groups.map(() => '?').join(',');
    options = db
      .prepare(
        `SELECT * FROM options WHERE group_id IN (${groupPlaceholders}) ORDER BY sort_order, id`
      )
      .all(...groups.map((group) => group.id));
  }

  const optionsByGroup = {};
  options.forEach((option) => {
    (optionsByGroup[option.group_id] = optionsByGroup[option.group_id] || []).push({
      id: option.id,
      name: option.name,
      delta: option.price_delta,
      is_default: Boolean(option.is_default)
    });
  });

  const map = {};
  groups.forEach((group) => {
    (map[group.menu_item_id] = map[group.menu_item_id] || []).push({
      id: group.id,
      name: group.name,
      type: group.type,
      required: Boolean(group.required),
      options: optionsByGroup[group.id] || []
    });
  });
  return map;
}

module.exports = { getOptionsForItems };
