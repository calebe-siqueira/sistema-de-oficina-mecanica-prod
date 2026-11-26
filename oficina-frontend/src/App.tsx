import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SystemToastContainer } from './components/modules/SystemMessages';
import { router } from './routes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ErrorFallbackScreen } from './screens/ErrorFallbackScreen';

export default function App() {
  return (
    <AuthProvider>
      <SystemToastContainer />
      <ErrorBoundary
        fallback={<ErrorFallbackScreen />}
      >
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AuthProvider>
  );
}
