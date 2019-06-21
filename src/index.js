import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
//import registerServiceWorker from './registerServiceWorker';

if(window.location.search.indexOf('user_token=')!==-1)
    window.history.replaceState({},'?','?');

ReactDOM.render(<App />, document.getElementById('root'));
//registerServiceWorker();
if(navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
    navigator.serviceWorker.getRegistrations()
        .then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
        }});