import React, {Component, PureComponent} from 'react';
import TimeAgo from 'react-timeago';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './Common.css';
import {clean_pid} from './text_splitter';

export function TitleLine(props) {
    return (
        <p className="centered-line title-line aux-margin">
            <span className="black-outline">{props.text}</span>
        </p>
    )
}

export const HAPI_DOMAIN=window.__WEBHOLE_HAPI_DOMAIN||'https://_BRAND_HAPI_DOMAIN';
export const GATEWAY_DOMAIN=window.__WEBHOLE_GATEWAY_DOMAIN||'https://_BRAND_GATEWAY_DOMAIN';

function pad2(x) {
    return x<10 ? '0'+x : ''+x;
}
export function format_time(time) {
    return `${time.getMonth()+1}-${pad2(time.getDate())} ${time.getHours()}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
}
const chinese_format=buildFormatter({
    prefixAgo: null,
    prefixFromNow: '未来',
    suffixAgo: '前',
    suffixFromNow: null,
    seconds: '不到1分钟',
    minute: '1分钟',
    minutes: '%d分钟',
    hour: '1小时',
    hours: '%d小时',
    day: '1天',
    days: '%d天',
    month: '1个月',
    months: '%d月',
    year: '1年',
    years: '%d年',

    wordSeparator: '',
});
export function Time(props) {
    let {stamp,...others}=props;
    const time=new Date(stamp*1000);
    return (
        <span {...others}>
            <TimeAgo date={time} formatter={chinese_format} title={time.toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                hour12: false,
            })} />
            &nbsp;
            {format_time(time)}
        </span>
    );
}


export function ColoredSpan(props) {
    return (
        <span className="colored-span" style={{
            '--coloredspan-bgcolor-light': props.colors[0],
            '--coloredspan-bgcolor-dark': props.colors[1],
        }}>{props.children}</span>
    )
}

export class HighlightedText extends PureComponent {
    render() {
        function normalize_url(url) {
            return /^https?:\/\//.test(url) ? url : 'http://'+url;
        }
        return (
            <pre>
                {this.props.parts.map((part,idx)=>{
                    let [rule,p]=part;
                    return (
                        <span key={idx}>{
                            rule==='url_pid' ? <span className="url-pid-link" title={p}>/##</span> :
                            rule==='url' ? <a href={normalize_url(p)} target="_blank" rel="noopener">{p}</a> :
                            rule==='pid_bare' ? <a href={'##'+p} onClick={(e)=>{e.preventDefault(); this.props.show_pid(p);}}>{p}</a> :
                            rule==='pid_prefixed' ? (()=>{
                                let pp=clean_pid(p);
                                return (<a href={'##'+pp} onClick={(e)=>{e.preventDefault(); this.props.show_pid(pp);}}>{p}</a>);
                            })() :
                            rule==='nickname' ? <ColoredSpan colors={this.props.color_picker.get(p)}>{p}</ColoredSpan> :
                            rule==='search' ? <span className="search-query-highlight">{p}</span> :
                            rule==='reply_nameplate' ? <span className="reply-nameplate">[{p}]</span> :
                            p
                        }</span>
                    );
                })}
            </pre>
        )
    }
}

window.TEXTAREA_BACKUP={};

export class SafeTextarea extends Component {
    constructor(props) {
        super(props);
        this.state={
            text: '',
        };
        this.on_change_bound=this.on_change.bind(this);
        this.on_keydown_bound=this.on_keydown.bind(this);
        this.clear=this.clear.bind(this);
        this.area_ref=React.createRef();
        this.change_callback=props.on_change||(()=>{});
        this.submit_callback=props.on_submit||(()=>{});
    }

    componentDidMount() {
        this.setState({
            text: window.TEXTAREA_BACKUP[this.props.id]||''
        },()=>{
            this.change_callback(this.state.text);
        });
    }

    componentWillUnmount() {
        window.TEXTAREA_BACKUP[this.props.id]=this.state.text;
        this.change_callback(this.state.text);
    }

    on_change(event) {
        this.setState({
            text: event.target.value,
        });
        this.change_callback(event.target.value);
    }
    on_keydown(event) {
        if(event.key==='Enter' && event.ctrlKey && !event.altKey) {
            event.preventDefault();
            this.submit_callback();
        }
    }

    clear() {
        this.setState({
            text: '',
        });
    }
    set(text) {
        this.change_callback(text);
        this.setState({
            text: text,
        });
    }
    get() {
        return this.state.text;
    }
    focus() {
        this.area_ref.current.focus();
    }

    render() {
        return (
            <textarea ref={this.area_ref} onChange={this.on_change_bound} value={this.state.text} onKeyDown={this.on_keydown_bound} />
        )
    }
}

let pwa_prompt_event=null;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('pwa: received before install prompt');
    pwa_prompt_event=e;
});

export function PromotionBar(props) {
    let is_ios=/iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    let is_installed=(window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone);

    if(is_installed)
        return null;

    if(is_ios)
        // noinspection JSConstructorReturnsPrimitive
        return !navigator.standalone ? (
            <div className="box promotion-bar">
                <span className="icon icon-about" />&nbsp;
                用 Safari 把_BRAND_NAME <b>添加到主屏幕</b> 更好用
            </div>
        ) : null;
    else
        // noinspection JSConstructorReturnsPrimitive
        return pwa_prompt_event ? (
            <div className="box promotion-bar">
                <span className="icon icon-about" />&nbsp;
                把_BRAND_NAME <b><a onClick={()=>{
                    if(pwa_prompt_event)
                        pwa_prompt_event.prompt();
            }}>安装到桌面</a></b> 更好用
            </div>
        ) : null;
}

export function BrowserWarningBar(props) {
    let cr_version=/Chrome\/(\d+)/.exec(navigator.userAgent);
    cr_version=cr_version?cr_version[1]:0;
    if(/MicroMessenger\/|QQ\//.test(navigator.userAgent))
        return (
            <div className="box box-tip box-warning">
                <b>您正在使用 QQ/微信 内嵌浏览器</b>
                <br />
                建议使用系统浏览器打开，否则可能出现兼容问题
            </div>
        );
    if(/Edge\/1/.test(navigator.userAgent))
        return (
            <div className="box box-tip box-warning">
                <b>您正在使用旧版 Microsoft Edge</b>
                <br />
                建议使用新版 Edge，否则可能出现兼容问题
            </div>
        );
    else if(cr_version>1 && cr_version<57)
        return (
            <div className="box box-tip box-warning">
                <b>您正在使用古老的 Chrome {cr_version}</b>
                <br />
                建议使用新版浏览器，否则可能出现兼容问题
            </div>
        );
    return null;
}

export class ClickHandler extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            moved: true,
            init_y: 0,
            init_x: 0,
        };
        this.on_begin_bound=this.on_begin.bind(this);
        this.on_move_bound=this.on_move.bind(this);
        this.on_end_bound=this.on_end.bind(this);

        this.MOVE_THRESHOLD=3;
        this.last_fire=0;
    }

    on_begin(e) {
        //console.log('click',(e.touches?e.touches[0]:e).screenY,(e.touches?e.touches[0]:e).screenX);
        this.setState({
            moved: false,
            init_y: (e.touches?e.touches[0]:e).screenY,
            init_x: (e.touches?e.touches[0]:e).screenX,
        });
    }
    on_move(e) {
        if(!this.state.moved) {
            let mvmt=Math.abs((e.touches?e.touches[0]:e).screenY-this.state.init_y)+Math.abs((e.touches?e.touches[0]:e).screenX-this.state.init_x);
            //console.log('move',mvmt);
            if(mvmt>this.MOVE_THRESHOLD)
                this.setState({
                    moved: true,
                });
        }
    }
    on_end(event) {
        //console.log('end');
        if(!this.state.moved)
            this.do_callback(event);
        this.setState({
            moved: true,
        });
    }

    do_callback(event) {
        if(this.last_fire+100>+new Date()) return;
        this.last_fire=+new Date();
        this.props.callback(event);
    }

    render() {
        return (
            <div onTouchStart={this.on_begin_bound} onMouseDown={this.on_begin_bound}
                 onTouchMove={this.on_move_bound} onMouseMove={this.on_move_bound}
                 onClick={this.on_end_bound} >
                {this.props.children}
            </div>
        )
    }
}