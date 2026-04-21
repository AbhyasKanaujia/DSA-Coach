import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';

function Layout({ children, showSidebar = true }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex">
      {showSidebar && (
        <>
          <Sidebar />
          <div className="hidden md:block w-64 flex-shrink-0" />
        </>
      )}

      <MobileDrawer />

      <main className="flex-1 min-h-0">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export default Layout;