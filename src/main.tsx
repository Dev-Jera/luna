import React from 'react';import ReactDOM from 'react-dom/client';import {Provider} from 'react-redux';import {BrowserRouter} from 'react-router-dom';import {store} from './store';import App from './App';import './index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Provider store={store}><BrowserRouter><App/></BrowserRouter></Provider></React.StrictMode>)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(unregistered => {
        if (unregistered) {
          console.log('Successfully unregistered stale service worker.');
          window.location.reload();
        }
      });
    }
  });
}
if ('caches' in window) {
  caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
  });
}

