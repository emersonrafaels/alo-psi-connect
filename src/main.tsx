import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ProfessionalRegistrationProvider } from './contexts/ProfessionalRegistrationContext'

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <ProfessionalRegistrationProvider>
    <App />
  </ProfessionalRegistrationProvider>
);
