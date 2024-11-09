import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import App from './App'; // Import the main App component

const container = document.getElementById('root');
const root = createRoot(container); // Create a root using createRoot

root.render(
  <BrowserRouter>
    <App /> {/* Only one BrowserRouter should wrap the App */}
  </BrowserRouter>
);
