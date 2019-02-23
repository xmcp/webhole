import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
//import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
//registerServiceWorker();
if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
    navigator.serviceWorker.getRegistrations()
        .then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
        }});