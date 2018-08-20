import React, {Component} from 'react';
import {Flow} from './Flows';
import {Title} from './Title';
import {Sidebar} from './Sidebar';
import {ControlBar} from './ControlBar';

class App extends Component {
    constructor(props) {
        super(props);
        this.state={
            sidebar_title: null,
            sidebar_content: null,
            search_text: null,
            flow_render_key: +new Date(),
        };
    }

    show_sidebar(title,content) {
        this.setState({
            sidebar_title: title,
            sidebar_content: content,
        });
    }

    set_search_text(text) {
        this.setState({
            search_text: text,
            flow_render_key: +new Date(),
        });
    }

    render() {
        return (
            <div>
                <div className="bg-img" />
                <Title callback={this.show_sidebar.bind(this)} />
                <div className="left-container">
                    <ControlBar set_search_text={this.set_search_text.bind(this)} />
                    <Flow key={this.state.flow_render_key}
                        callback={this.show_sidebar.bind(this)} search_text={this.state.search_text}
                    />
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
