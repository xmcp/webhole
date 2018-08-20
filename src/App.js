import React, {Component} from 'react';
import {Flow} from './Flows';
import {Title} from './Title';
import {Sidebar} from './Sidebar';

class App extends Component {
    constructor(props) {
        super(props);
        this.state={
            sidebar_title: null,
            sidebar_content: null,
        };
    }

    show_sidebar(title,content) {
        this.setState({
            sidebar_title: title,
            sidebar_content: content,
        });
    }

    render() {
        return (
            <div>
                <Title callback={this.show_sidebar.bind(this)} />
                <div className="left-container">
                    <Flow callback={this.show_sidebar.bind(this)} mode="list" />
                </div>
                <Sidebar do_close={()=>{
                    this.setState({
                        sidebar_content: null,
                    });
                }} content={this.state.sidebar_content} title={this.state.sidebar_title} />
            </div>
        );
    }
}

export default App;
