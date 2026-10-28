import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AccessibilityToolbar } from './components/common/AccessibilityToolbar';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <AppRoutes />
          <AccessibilityToolbar />
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
