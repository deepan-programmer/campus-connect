import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MessagingProvider } from './contexts/MessagingContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { FeedPage } from './pages/FeedPage';
import { EventsPage } from './pages/EventsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { MentorshipPage } from './pages/MentorshipPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminPage } from './pages/AdminPage';
import { MessagesPage } from './pages/MessagesPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('feed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'feed':
        return <FeedPage />;
      case 'events':
        return <EventsPage />;
      case 'connections':
        return <ConnectionsPage />;
      case 'mentorship':
        return <MentorshipPage />;
      case 'messages':
        return <MessagesPage />;
      case 'profile':
        return <ProfilePage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'admin':
        return user.role === 'admin' ? <AdminPage /> : <FeedPage />;
      default:
        return <FeedPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <MessagingProvider>
        <AppContent />
      </MessagingProvider>
    </AuthProvider>
  );
}

export default App;
