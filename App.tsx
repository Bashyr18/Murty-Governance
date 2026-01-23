
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './views/Dashboard';
import { Portfolio } from './views/Portfolio';
import { People } from './views/People';
import { ProjectCockpit } from './views/ProjectCockpit';
import { PersonProfile } from './views/PersonProfile';
import { Settings } from './views/Settings';
import { CalendarView } from './views/CalendarView';
import { Login } from './views/Login';
import { GlobalSearch } from './views/GlobalSearch';
import { Drawer } from './components/Drawer';
import { Toasts } from './components/Toasts';

const MainContent: React.FC = () => {
  const { state } = useApp();
  const { view } = state.ui;

  const renderView = () => {
    switch (view) {
      case 'dash': return <Dashboard />;
      case 'portfolio': return <Portfolio />;
      case 'people': return <People />;
      case 'project': return <ProjectCockpit />;
      case 'person': return <PersonProfile />;
      case 'calendar': return <CalendarView />;
      case 'settings': return <Settings />;
      case 'search': return <GlobalSearch />;
      default: return <Dashboard />;
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[var(--bg)] transition-all">
      <Header />
      <div className="flex-1 overflow-auto p-4 lg:p-6 pb-24 lg:pb-6 custom-scrollbar">
        {renderView()}
      </div>
      <MobileNav />
    </main>
  );
};

const Layout: React.FC = () => {
  const { state } = useApp();
  
  if (!state.ui.isAuthenticated) {
    return (
        <>
            <Login />
            <Toasts />
        </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-[13px] bg-[var(--bg)] text-[var(--ink)]">
      {/* Sidebar hidden on mobile via CSS classes in Sidebar component, but ensuring layout structure handles it */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>
      <MainContent />
      <Drawer />
      <Toasts />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
};

export default App;
