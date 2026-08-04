type Tone = 'slate' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';

const toneMap: Record<string, Tone> = {
  active: 'green',
  inactive: 'slate',
  suspended: 'red',
  pending: 'yellow',
  probation: 'yellow',
  'on-leave': 'yellow',
  resigned: 'slate',
  terminated: 'red',
  archived: 'slate',
  planning: 'blue',
  'on-hold': 'yellow',
  completed: 'green',
  cancelled: 'red',
  todo: 'slate',
  'in-progress': 'blue',
  hold: 'yellow',
  review: 'purple',
  blocked: 'red',
  low: 'slate',
  medium: 'blue',
  high: 'yellow',
  urgent: 'red',
  admin: 'purple',
  manager: 'blue',
  teamlead: 'blue',
  member: 'slate',
  guest: 'slate',
};

export const statusTone = (value: string): Tone => toneMap[value] ?? 'slate';
