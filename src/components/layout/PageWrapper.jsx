import { useNavigation, Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PageWrapper() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {isLoading && (
        <div className="fixed top-0 inset-x-0 z-50 h-0.5 bg-accent animate-pulse" />
      )}

      <Navbar />

      <main
        className={`flex-1 max-w-5xl w-full mx-auto px-4 py-8 transition-opacity duration-150 ${
          isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
