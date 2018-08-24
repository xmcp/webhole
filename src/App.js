import React, {Component} from 'react';
import {Flow} from './Flows';
import {Title} from './Title';
import {Sidebar} from './Sidebar';
import {PressureHelper} from './PressureHelper';
import {TokenCtx} from './UserAction';

class App extends Component {
    constructor(props) {
        super(props);
        this.state={
            sidebar_title: '',
            sidebar_content: null, // determine status of sidebar
            mode: 'list', // list, single, search, attention
            search_text: null,
            flow_render_key: +new Date(),
            token: localStorage['TOKEN']||null,
        };
        this.show_sidebar_bound=this.show_sidebar.bind(this);
        this.set_mode_bound=this.set_mode.bind(this);
        this.on_pressure_bound=this.on_pressure.bind(this);
    }

    on_pressure() {
        if(this.state.sidebar_content)
            this.setState({
                sidebar_title: '',
                sidebar_content: null,
            });
        else
            this.set_mode('list',null);
    }

    show_sidebar(title,content) {
        this.setState({
            sidebar_title: title,
            sidebar_content: content,
        });
    }

    set_mode(mode,search_text) {
        this.setState({
            mode: mode,
            search_text: search_text,
            flow_render_key: +new Date(),
        });
    }

    render() {
        return (
            <TokenCtx.Provider value={{
                value: this.state.token,
                set_value: (x)=>{
                    localStorage['TOKEN']=x||'';
                    this.setState({
                        token: x,
                    });
                },
            }}>
                <PressureHelper callback={this.on_pressure_bound} />
                <div className="bg-img" style={{
                    backgroundImage: 'url('+(localStorage['REPLACE_ERIRI_WITH_URL'] || 'static/eriri_bg.jpg')+')'
                }} />
                <Title show_sidebar={this.show_sidebar_bound} set_mode={this.set_mode_bound} />
                <div className="left-container">
                    <TokenCtx.Consumer>{(token)=>(
                        <Flow key={this.state.flow_render_key} show_sidebar={this.show_sidebar_bound}
                              mode={this.state.mode} search_text={this.state.search_text} token={token.value}
                        />
                    )}</TokenCtx.Consumer>
                    <br />
                </div>
                <Sidebar do_close={()=>{
                    this.setState({
                        sidebar_content: null,
                    });
                }} content={this.state.sidebar_content} title={this.state.sidebar_title} />
            </TokenCtx.Provider>
        );
    }
}

export default App;
