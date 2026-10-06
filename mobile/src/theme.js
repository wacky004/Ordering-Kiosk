export const colors = {
  red: '#da291c',
  redDark: '#a81c12',
  redSoft: '#fdecea',
  yellow: '#ffc72c',
  yellowDark: '#e0a800',
  ink: '#1c1c1c',
  muted: '#6d6d6d',
  bg: '#f4f4f5',
  card: '#ffffff',
  line: '#e7e7e9',
  green: '#17914f',
  greenSoft: '#e6f6ed',
  blue: '#2563d4',
  blueSoft: '#e8effc',
  orangeSoft: '#fff3e0',
  orange: '#e07b00',
};

export const statusColors = {
  received: { bg: colors.blueSoft, fg: colors.blue },
  preparing: { bg: colors.orangeSoft, fg: colors.orange },
  ready: { bg: colors.yellow, fg: '#4a3300' },
  completed: { bg: colors.greenSoft, fg: colors.green },
  cancelled: { bg: colors.redSoft, fg: colors.red },
};

export const statusLabels = {
  received: 'Order Received',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const statusIcons = {
  received: '🧾',
  preparing: '👨‍🍳',
  ready: '🔔',
  completed: '✅',
  cancelled: '❌',
};

export function money(value) {
  return '₱' + Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
