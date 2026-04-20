import { diffColor, statusColor } from '../../../src/lib/colors';

describe('diffColor', () => {
  it('returns easy color for easy difficulty', () => {
    expect(diffColor('easy')).toBe('oklch(0.78 0.13 145)');
  });

  it('returns medium color for medium difficulty', () => {
    expect(diffColor('medium')).toBe('oklch(0.78 0.13 75)');
  });

  it('returns hard color for hard difficulty', () => {
    expect(diffColor('hard')).toBe('oklch(0.72 0.15 25)');
  });

  it('returns default color for unknown difficulty', () => {
    expect(diffColor('unknown')).toBe('oklch(0.46 0.01 240)');
  });
});

describe('statusColor', () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  it('returns due now when dueDate is today or past', () => {
    expect(statusColor({ dueDate: today })).toEqual({ label: 'due now', color: 'oklch(0.78 0.13 75)' });
    expect(statusColor({ dueDate: yesterday })).toEqual({ label: 'due now', color: 'oklch(0.78 0.13 75)' });
  });

  it('returns struggling when lapseCount >= 3', () => {
    expect(statusColor({ lapseCount: 3 })).toEqual({ label: 'struggling', color: 'oklch(0.72 0.15 25)' });
    expect(statusColor({ lapseCount: 5 })).toEqual({ label: 'struggling', color: 'oklch(0.72 0.15 25)' });
  });

  it('returns mastered when repetition >= 5', () => {
    expect(statusColor({ repetition: 5 })).toEqual({ label: 'mastered', color: 'oklch(0.78 0.13 145)' });
    expect(statusColor({ repetition: 10 })).toEqual({ label: 'mastered', color: 'oklch(0.78 0.13 145)' });
  });

  it('returns learning by default', () => {
    expect(statusColor({ dueDate: tomorrow, lapseCount: 0, repetition: 0 }))
      .toEqual({ label: 'learning', color: 'oklch(0.78 0.13 230)' });
  });

  it('prioritizes due now over other statuses', () => {
    expect(statusColor({ dueDate: today, lapseCount: 3, repetition: 10 }))
      .toEqual({ label: 'due now', color: 'oklch(0.78 0.13 75)' });
  });

  it('prioritizes struggling over mastered', () => {
    expect(statusColor({ dueDate: tomorrow, lapseCount: 3, repetition: 10 }))
      .toEqual({ label: 'struggling', color: 'oklch(0.72 0.15 25)' });
  });
});