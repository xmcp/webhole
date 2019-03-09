import React, {Component} from 'react';
import {Flow} from './Flows';
import {Title} from './Title';
import {Sidebar} from './Sidebar';
import {PressureHelper} from './PressureHelper';
import {TokenCtx} from './UserAction';

function DeprecatedAlert(props) {
    if(['pkuhelper.com','www.pkuhelper.com','webhole.xmcp.ml','127.0.0.1','localhost'].indexOf(document.domain)===-1)
        return (
            <div className="flow-item-row">
                <div className="box box-tip aux-margin">
                    <p><b>官宣了！</b></p>
                    <br />
                    <p>请访问官方树洞网页版</p>
                    <p><a href="http://pkuhelper.com/hole">http://pkuhelper.com/hole</a></p>
                    <p>加载三倍速，访问不卡顿</p>
                    <br />
                    <p>当前域名将停止维护。</p>
                    <p>@xmcp</p>
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
                <TokenCtx.Consumer>{(token)=>(
                    <div className="left-container">
                        <DeprecatedAlert token={token.value} />
                        <Flow key={this.state.flow_render_key} show_sidebar={this.show_sidebar_bound}
                              mode={this.state.mode} search_text={this.state.search_text} token={token.value}
                        />
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
