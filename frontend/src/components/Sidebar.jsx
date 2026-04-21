import { memo, useCallback, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, BookOpen, BarChart3, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import packageJson from '../../package.json';

const APP_VERSION = packageJson.version;

const menuItems = [
  { id: 'review', label: 'Review', icon: Zap, path: '/review', primary: true },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'library', label: 'Library', icon: BookOpen, path: '/cards' },
  { id: 'stats', label: 'Stats', icon: BarChart3, path: '/stats' },
];

function Sidebar({ onNavigate }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const handleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  return (
    <aside
      className={`sidebar fixed left-0 top-0 h-full bg-bg border-r border-border transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${isMobile ? 'hidden' : ''}`}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-text">
              <span className="text-accent">~/</span>
              {!isCollapsed && <span>dsa_coach</span>}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Navigation menu">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isHovered = hoveredItem === item.id;

              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => onNavigate && onNavigate(item.path)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-bgLift text-text'
                        : 'text-textDim'
                    } ${isHovered && !isActive ? 'text-text' : ''} ${
                      item.primary && !isActive ? 'text-accent' : ''
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-accent' : ''
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="flex-1 font-medium">{item.label}</span>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-bgCard border border-border rounded text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}

            {!isCollapsed && (
              <>
                <li className="border-t border-border my-3"></li>
                <li className="flex justify-end">
                  <button
                    onClick={handleCollapse}
                    className="p-2 rounded-lg hover:bg-bgLift text-textMuted hover:text-text transition-colors duration-200"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </li>
              </>
            )}

            {isCollapsed && (
              <>
                <li className="border-t border-border my-3"></li>
                <li className="flex justify-center">
                  <button
                    onClick={handleCollapse}
                    className="p-2 rounded-lg hover:bg-bgLift text-textMuted hover:text-text transition-colors duration-200"
                    aria-label="Expand sidebar"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-border">
            <Link
              to="/cards/new"
              onClick={() => onNavigate && onNavigate('/cards/new')}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-bgLift hover:bg-bgCard border border-border rounded-lg transition-colors text-textDim hover:text-text font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Card</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

export default memo(Sidebar);