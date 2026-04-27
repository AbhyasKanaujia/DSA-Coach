import Badge from './Badge';

const map = {
  easy: 'accent',
  medium: 'warn',
  hard: 'danger'
};

export default function DifficultyPill({ difficulty }) {
  const variant = map[difficulty] || 'neutral';
  return (
    <Badge variant={variant}>
      <span className="capitalize">{difficulty}</span>
    </Badge>
  );
}
