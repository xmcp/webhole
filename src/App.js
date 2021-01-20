import React, {Component} from 'react';
import {SwitchTransition, CSSTransition} from 'react-transition-group';
import {Flow, load_single_meta} from './Flows';
import {Title} from './Title';
import {Alerts} from './Alerts';
import {Sidebar} from './Sidebar';
import {PressureHelper} from './PressureHelper';
import {TokenCtx} from './UserAction';
import {load_config,bgimg_style} from './Config';
import {HAPI_DOMAIN} from './Common';
import {LandingPage} from './Welcome';
import {cache} from './cache';
import {get_json} from './flows_api';

import './App.css';

const MAX_SIDEBAR_STACK_SIZE=10;
const USER_INFO_REFRESH_INTV_MS=60000;

function listen_darkmode(override) { // override: true/false/undefined
    function update_color_scheme() {
        if(override===undefined ? window.matchMedia('(prefers-color-scheme: dark)').matches : override)
            document.body.classList.add('root-dark-mode');
        else
            document.body.classList.remove('root-dark-mode');
    }

    update_color_scheme();
    window.matchMedia('(prefers-color-scheme: dark)').addListener(()=>{
        update_color_scheme();
    });
}

const DEFAULT_USER_INFO={entitlements: [], alerts: [], version: '...', remember_token: null};

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
            user_token: localStorage['WEBHOLE_TOKEN']||null,
            user_info: DEFAULT_USER_INFO,
            user_info_status: 'loading',
            user_info_lasttime: -USER_INFO_REFRESH_INTV_MS,
        };
        this.show_sidebar_bound=this.show_sidebar.bind(this);
        this.set_mode_bound=this.set_mode.bind(this);
        this.on_pressure_bound=this.on_pressure.bind(this);
    }

    componentDidMount() {
        cache(); // init db first

        window._webhole_show_hole=(...args)=>{
            // delay execution so user_token always gets the latest value
            load_single_meta(this.show_sidebar.bind(this),this.state.user_token)(...args);
        };

        if(this.state.user_token)
            this.get_user_info(this.state.user_token);

        if(!window.config.blur_effect)
            document.body.classList.add('root-no-blur');
    }

    get_user_info(token) {
        this.setState({
            //user_info: DEFAULT_USER_INFO,
            user_info_status: 'loading',
        });
        console.log('get user info');
        fetch(HAPI_DOMAIN+'/api/users/info?user_token='+encodeURIComponent(token))
            .then(get_json)
            .then((res)=>{
                if(res.error)
                    throw new Error(res.error_msg||res.error)

                this.setState({
                    user_info: res,
                    user_info_status: 'done',
                    user_info_lasttime: (+new Date()),
                });
            })
            .catch((e)=>{
                console.error('failed to load user info',e);
                this.setState({
                    user_info_status: 'failed',
                });
            });
    }

    do_login(token) {
        this.setState({user_token: token});
        localStorage['WEBHOLE_TOKEN']=token;
        this.get_user_info(token);
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
        this.setState((prevState)=>{
            let ns=prevState.sidebar_stack.slice();
            if(mode==='push') {
                if(ns.length>MAX_SIDEBAR_STACK_SIZE)
                    ns.splice(1,1);
                ns=ns.concat([[title,content]]);
            } else if(mode==='pop') {
                if(ns.length===1) return;
                ns.pop();
            } else if(mode==='replace') {
                ns.pop();
                ns=ns.concat([[title,content]]);
            } else if(mode==='clear') {
                ns=[[null,null]];
            } else
                throw new Error('bad show_sidebar mode');
            return {
                sidebar_stack: ns,
            };
        });
    }

    set_mode(mode,search_text) {
        this.setState({
            mode: mode,
            search_text: search_text,
            flow_render_key: +new Date(),
        });
        if((+new Date())-this.state.user_info_lasttime>USER_INFO_REFRESH_INTV_MS && this.state.user_token && this.state.user_info_status!=='loading')
            this.get_user_info(this.state.user_token);
    }

    render() {
        if(!this.state.user_token)
            return (
                <LandingPage do_login={this.do_login.bind(this)} />
            );

        return (
            <TokenCtx.Provider value={{
                value: this.state.user_token,
                perm: this.state.user_info.entitlements,
                backend_version: this.state.user_info.version,
                remember_token: this.state.user_info.remember_token,
                logout: ()=>{
                    delete localStorage['WEBHOLE_TOKEN'];
                    this.setState({
                        user_token: null,
                        user_info: DEFAULT_USER_INFO,
                    });
                },
            }}>
                <PressureHelper callback={this.on_pressure_bound} />
                <div className="bg-img" style={bgimg_style()} />
                <Title show_sidebar={this.show_sidebar_bound} set_mode={this.set_mode_bound} />
                <TokenCtx.Consumer>{(token)=>(
                    <div className="left-container">
                        {this.state.user_info_status==='failed' &&
                            <div className="flow-item-row">
                                <div className="flow-item box box-warning">
                                    用户信息加载失败，
                                    <a onClick={()=>this.get_user_info(token.value)}>点击重试</a>
                                </div>
                            </div>
                        }
                        <Alerts token={token.value} info={this.state.user_info} />
                        <SwitchTransition mode="out-in">
                            <CSSTransition key={this.state.flow_render_key} timeout={100} classNames="flows-anim">
                                <Flow key={this.state.flow_render_key} show_sidebar={this.show_sidebar_bound}
                                      mode={this.state.mode} search_text={this.state.search_text} token={token.value}
                                />
                            </CSSTransition>
                        </SwitchTransition>
                        <br />
                    </div>
                )}</TokenCtx.Consumer>
                <Sidebar show_sidebar={this.show_sidebar_bound} stack={this.state.sidebar_stack} />
            </TokenCtx.Provider>
        );
    }
}

export default App;
