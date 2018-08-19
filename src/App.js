import React, {Component} from 'react';
import './App.css';
import {Flow} from './Flows';
import {Title} from './Title';

class App extends Component {
    show_details(info) {

    }

    render() {
        return (
            <div>
                <Title />
                <div className="left-container">
                    <Flow callback={(info)=>this.show_details(info)} mode="list" />
                </div>
            </div>
        );
    }
}

export default App;
