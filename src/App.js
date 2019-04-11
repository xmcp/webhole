import React, {Component} from 'react';
import {Flow} from './Flows';
import {Title} from './Title';
import {Sidebar} from './Sidebar';
import {PressureHelper} from './PressureHelper';
import {TokenCtx,ISOP_APPKEY} from './UserAction';

import ImasuguApp from './imasugu/src/App';

function DeprecatedAlert(props) {
    if(['pkuhelper.pku.edu.cn','127.0.0.1','localhostx'].indexOf(document.domain)===-1)
        return (
            <div className="flow-item-row">
                <div className="box box-tip aux-margin">
                    <p><b>树洞又㕛叒换域名了！</b></p>
                    <br />
                    <p>请记住新网址：</p>
                    <p><a href="https://pkuhelper.pku.edu.cn/hole">pkuhelper.pku.edu.cn/hole</a></p>
                    <br />
                    <p>当前域名我也不清楚什么时候停止维护。</p>
                    <p>另外我们终于支持 HTTPS 和 HTTP/2 了。</p>
                    <br />
                    <TokenCtx.Consumer>{(token)=>(
                        !!token.value && <div>
                            <p>*Tips: </p>
                            <p>点击右上角的 <span className="icon icon-about" /> ，复制 User Token，在新网址的登录页面输入，就不用重发验证码了。</p>
                            <br />
                        </div>
                    )}</TokenCtx.Consumer>
                    <p>@xmcp from PKUHelper Team</p>
                </div>
            </div>
        );
    if(props.token && props.token.startsWith('isop_'))
        return (
            <div className="flow-item-row">
                <div className="box box-tip box-danger aux-margin">
                    <p>树洞于2019年3月更新登录方式，原先登录已失效。</p>
                    <p>请按右上角的按钮，点“注销”，然后重新登录。</p>
                    <p><b>好消息：更新后支持客户端和网页同时使用了！</b></p>
                </div>
            </div>
        );
    return null;
}

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
        // a silly self-deceptive approach to ban guests, enough to fool those muggles
        //                     document             cookie                    'pku_ip_flag=yes'
        this.inpku_flag=window[atob('ZG9jdW1lbnQ')][atob('Y29va2ll')].indexOf(atob('cGt1X2lwX2ZsYWc9eWVz'))!==-1;
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
        if(window.location.search.match(/[?&]imasugu($|&)/)) {
            document.body.style.backgroundColor='white';
            return (
                <ImasuguApp api_base={`proxy_building?appKey=${ISOP_APPKEY}&buildingName={building}`} />
            );
        }

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
                <TokenCtx.Consumer>{(token)=>(
                    <div className="left-container">
                        <DeprecatedAlert token={token.value} />
                        {this.inpku_flag||token.value ?
                            <Flow key={this.state.flow_render_key} show_sidebar={this.show_sidebar_bound}
                                  mode={this.state.mode} search_text={this.state.search_text} token={token.value}
                            /> :
                            <div className="flow-item-row">
                                <div className="box box-tip aux-margin">
                                    <p>本网站仅限校内用户使用</p>
                                    <p>请点击右上角的 <span className="icon icon-login" /> 按钮登录</p>
                                </div>
                            </div>
                        }
                        <br />
                    </div>
                )}</TokenCtx.Consumer>
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
