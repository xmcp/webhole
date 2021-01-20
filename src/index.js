import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import {ErrorBoundary} from './ErrorBoundary';
import * as serviceWorker from './serviceWorker';

import './index.css';
import './icomoon.css';

ReactDOM.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
    , document.getElementById('root'));

serviceWorker.register();
