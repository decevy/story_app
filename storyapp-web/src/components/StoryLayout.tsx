// src/components/StoryLayout.tsx

import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStory } from '../contexts/StoryContext';
import { useNavigate } from 'react-router-dom';

interface StoryLayoutProps {
  sidebar: ReactNode;    // Left side - story list
  mainContent: ReactNode;   // Right side - turns + input
}

export function StoryLayout({ sidebar, mainContent }: StoryLayoutProps) {
  const { user, logout } = useAuth();
  const { isConnected } = useStory();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
        
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">StoryApp</h1>
          
          {/* Connection Status Indicator (left) */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* User Info & Logout (right) */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">{user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 arounded-lg corner-squircle hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Story list (left sidebar) */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {sidebar}
        </aside>

        {/* Turns + input (right side) */}
        <main className="flex-1 flex flex-col bg-gray-50">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
