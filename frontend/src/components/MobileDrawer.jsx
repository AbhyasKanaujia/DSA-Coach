import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Menu, Zap, LayoutDashboard, BookOpen, BarChart3, Plus } from 'lucide-react';
import packageJson from '../../package.json';

const APP_VERSION = packageJson.version;

const menuItems = [
  { id: 'review', label: 'Review', icon: Zap, path: '/review', primary: true },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'library', label: 'Library', icon: BookOpen, path: '/cards' },
  { id: 'stats', label: 'Stats', icon: BarChart3, path: '/stats' },
];

function MobileDrawer({ onNavigate }) {
  const location = useLocation();
  const [isOpen, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <div className="mobnav fixed bottom-0 left-0 right-0 h-16 bg-bg border-t border-border flex items-center justify-between px-4 z-50 md:hidden">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-text">
            <span className="text-accent">~/</span>dsa_coach
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-bgLift text-textMuted hover:text-text transition-colors duration-200"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div
          className="mobnav fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
          onClick={handleBackdropClick}
          aria-hidden="true"
        >
          <div className="absolute bottom-16 left-0 right-0 bg-bg max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-border">
            <div className="sticky top-0 bg-bg px-4 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-text">
                  <span className="text-accent">~/</span>dsa_coach
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-bgLift text-textMuted hover:text-text transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="px-3 py-3" aria-label="Navigation menu">
              <ul className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const isHovered = hoveredItem === item.id;

                  return (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 min-h-[48px] ${
                          isActive
                            ? 'bg-bgLift text-text'
                            : 'text-textDim'
                        } ${isHovered && !isActive ? 'text-text' : ''} ${
                          item.primary && !isActive ? 'text-accent' : ''
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                            isActive ? 'text-accent' : ''
                          }`}
                        />
                        <span className="flex-1 font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-4 py-3 border-t border-border">
              <Link
                to="/cards/new"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-bgLift hover:bg-bgCard border border-border rounded-lg transition-colors text-textDim hover:text-text font-medium min-h-[48px]"
              >
                <Plus className="w-5 h-5" />
                <span>New Card</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(MobileDrawer);