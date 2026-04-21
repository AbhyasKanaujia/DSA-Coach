import { Zap, BookOpen, Boxes, BarChart3 } from 'lucide-react';

export const menuItems = [
  { id: 'review', label: 'Review', icon: Zap, path: '/review', primary: true },
  { id: 'library', label: 'Library', icon: BookOpen, path: '/cards' },
  { id: 'problems', label: 'Problems', icon: Boxes, path: '/problems' },
  { id: 'stats', label: 'Stats', icon: BarChart3, path: '/stats' },
];