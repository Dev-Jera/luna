import React from 'react';import ReactDOM from 'react-dom/client';import {Provider} from 'react-redux';import {BrowserRouter} from 'react-router-dom';import {store} from './store';import App from './App';import './index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Provider store={store}><BrowserRouter><App/></BrowserRouter></Provider></React.StrictMode>)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('ServiceWorker registered:', reg))
      .catch(err => console.error('ServiceWorker registration failed:', err));
  });
}

