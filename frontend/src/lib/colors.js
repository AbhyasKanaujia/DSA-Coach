// Difficulty color utility
export const diffColor = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return 'oklch(0.78 0.13 145)'; // accent green
    case 'medium':
      return 'oklch(0.78 0.13 75)'; // warn amber
    case 'hard':
      return 'oklch(0.72 0.15 25)'; // danger red
    default:
      return 'oklch(0.46 0.01 240)'; // textMuted
  }
};

// Status color utility
export const statusColor = (card) => {
  const today = new Date().toISOString().split('T')[0];
  if (card.dueDate <= today) {
    return { label: 'due now', color: 'oklch(0.78 0.13 75)' }; // warn amber
  }
  if (card.lapseCount >= 3) {
    return { label: 'struggling', color: 'oklch(0.72 0.15 25)' }; // danger red
  }
  if (card.repetition >= 5) {
    return { label: 'mastered', color: 'oklch(0.78 0.13 145)' }; // accent green
  }
  return { label: 'learning', color: 'oklch(0.78 0.13 230)' }; // info blue
};