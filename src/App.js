import React, {Component} from 'react';
import {Flow} from './Flows';
import {Title} from './Title';
import {Sidebar} from './Sidebar';
import {PressureHelper} from './PressureHelper';
import {TokenCtx} from './UserAction';
import {load_config,bgimg_style} from './Config';
import {listen_darkmode} from './infrastructure/functions';

function DeprecatedAlert(props) {
    return null;
}

class App extends Component {
    constructor(props) {
        super(props);
        load_config();
        listen_darkmode({default: undefined, light: false, dark: true}[window.config.color_scheme]);
        this.state={
            sidebar_stack: [[null,null]], // list of [status, content]
            mode: 'list', // list, single, search, attention
            search_text: null,
            flow_render_key: +new Date(),
            token: localStorage['TOKEN']||null,
        };
        this.show_sidebar_bound=this.show_sidebar.bind(this);
        this.set_mode_bound=this.set_mode.bind(this);
        this.on_pressure_bound=this.on_pressure.bind(this);
        // a silly self-deceptive approach to ban guests, enough to fool those muggles
        //                     document             cookie                    'pku_ip_flag=yes'
        this.inpku_flag=window[atob('ZG9jdW1lbnQ')][atob('Y29va2ll')].indexOf(atob('cGt1X2lwX2ZsYWc9eWVz'))!==-1;
    }

    static is_darkmode() {
        if(window.config.color_scheme==='dark') return true;
        if(window.config.color_scheme==='light') return false;
        else { // 'default'
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    }

    on_pressure() {
        if(this.state.sidebar_stack.length>1)
            this.show_sidebar(null,null,'clear');
        else
            this.set_mode('list',null);
    }

    show_sidebar(title,content,mode='push') {
        if(mode==='push') {
            this.setState((prevState)=>({
                sidebar_stack: prevState.sidebar_stack.concat([[title,content]]),
            }));
        } else if(mode==='pop') {
            this.setState((prevState)=>{
                let ns=prevState.sidebar_stack.slice();
                ns.pop();
                return {
                    sidebar_stack: ns,
                };
            });
        } else if(mode==='replace') {
            this.setState((prevState)=>{
                let ns=prevState.sidebar_stack.slice();
                ns.pop();
                return {
                    sidebar_stack: ns.concat([[title,content]]),
                };
            });
        } else if(mode==='clear') {
            this.setState({
                sidebar_stack: [[null,null]],
            });
        } else
            throw new Error('bad show_sidebar mode');
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
                <div className="bg-img" style={bgimg_style()} />
                <Title show_sidebar={this.show_sidebar_bound} set_mode={this.set_mode_bound} />
                <TokenCtx.Consumer>{(token)=>(
                    <div className="left-container">
                        <DeprecatedAlert token={token.value} />
                        {!token.value &&
                            <div className="flow-item-row aux-margin">
                                <div className="box box-tip">
                                    <p>点击右上角的 <span className="icon icon-login" /> 按钮登录</p>
                                </div>
                            </div>
                        }
                        {this.inpku_flag||token.value ?
                            <Flow key={this.state.flow_render_key} show_sidebar={this.show_sidebar_bound}
                                  mode={this.state.mode} search_text={this.state.search_text} token={token.value}
                            /> :
                            <div className="flow-item-row aux-margin">
                                <div className="box box-tip">
                                    <p>本网站仅限校内用户使用，请登录后访问。</p>
                                </div>
                            </div>
                        }
                        <br />
                    </div>
                )}</TokenCtx.Consumer>
                <Sidebar show_sidebar={this.show_sidebar_bound} stack={this.state.sidebar_stack} />
            </TokenCtx.Provider>
        );
    }
}

export default App;
