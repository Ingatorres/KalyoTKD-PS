import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { PublicDisplayApp } from '../PublicDisplayApp';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PublicDisplayApp />
  </React.StrictMode>,
);