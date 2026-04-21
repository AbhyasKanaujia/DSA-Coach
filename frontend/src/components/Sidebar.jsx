import { memo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { menuItems } from './nav/items';

function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (!isMobileOpen) return;

    document.body.style.overflow = 'hidden';
    const handleEscape = (e) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileOpen, onMobileClose]);

  const handleNavigate = () => {
    if (isMobileOpen) onMobileClose();
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 bg-bg border-r border-border transition-all duration-300 md:sticky md:top-0 md:h-screen md:flex-shrink-0 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-64 md:w-16' : 'w-64'}`}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4">
            <Link
              to="/"
              onClick={handleNavigate}
              className="font-mono font-bold text-text hover:text-accent transition-colors"
            >
              <span className="text-accent">~/</span>
              <span className={isCollapsed ? 'md:hidden' : ''}>dsa_coach</span>
            </Link>
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
                      onClick={handleNavigate}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ${
                        isActive ? 'bg-bgLift text-text' : 'text-textDim'
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
                      <span className={`flex-1 font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
                        {item.label}
                      </span>
                      {isCollapsed && (
                        <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-bgCard border border-border rounded text-xs text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}

              <li className="border-t border-border my-3 -mx-3"></li>
              <li className={`hidden md:flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
                <button
                  onClick={onToggleCollapse}
                  className="p-2 rounded-lg hover:bg-bgLift text-textMuted hover:text-text transition-colors duration-200"
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              </li>
            </ul>
          </nav>

          <div className={`px-4 py-3 border-t border-border ${isCollapsed ? 'md:hidden' : ''}`}>
            <Link
              to="/cards/new"
              onClick={handleNavigate}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-bgLift hover:bg-bgCard border border-border rounded-lg transition-colors text-textDim hover:text-text font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Card</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);
