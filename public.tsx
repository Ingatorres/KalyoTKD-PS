import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicDisplayApp } from './PublicDisplayApp';
import './src/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to for PDI");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PublicDisplayApp />
  </React.StrictMode>
);
