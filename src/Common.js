import React, {Component, PureComponent} from 'react';

import TimeAgo from 'react-timeago';
import Linkify from 'react-linkify';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './Common.css';

const chinese_format=buildFormatter(chineseStrings);

export const API_BASE=window.location.protocol==='https:' ? '/api_proxy' : 'http://www.pkuhelper.com:10301/services/pkuhole';

const PID_RE=/(^|[^\d])([1-9]\d{4,5})(?!\d)/g;
const NICKNAME_RE=/(^|[^A-Za-z])((?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Japanese|Kind|Little|Magic|Naïve|Old|Powerful|Quiet|Rich|Superman|THU|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \d+)?|洞主)(?![A-Za-z])/gi;

function pad2(x) {
    return x<10 ? '0'+x : ''+x;
}

export function format_time(time) {
    return `${time.getMonth()+1}-${pad2(time.getDate())} ${time.getHours()}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
}

export function Time(props) {
    const time=new Date(props.stamp*1000);
    return (
        <span>
            <TimeAgo date={time} formatter={chinese_format} />
            &nbsp;
            {format_time(time)}
        </span>
    );
}

export function TitleLine(props) {
    return (
        <p className="centered-line title-line aux-margin">
            <span className="black-outline">{props.text}</span>
        </p>
    )
}

export class HighlightedText extends PureComponent {
    render() {
        let parts=[].concat.apply([], this.props.text.split(PID_RE).map((p)=>p.split(NICKNAME_RE)));
        return (
            <Linkify properties={{target: '_blank'}}>
                <pre>
                    {parts.map((p,idx)=>(
                        <span key={idx}>{
                            PID_RE.test(p) ? <a href={'##'+p} onClick={(e)=>{e.preventDefault(); this.props.show_pid(p);}}>{p}</a> :
                            NICKNAME_RE.test(p) ? <span style={{backgroundColor: this.props.color_picker.get(p)}}>{p}</span> :
                            p
                        }</span>
                    ))}
                </pre>
            </Linkify>
        )
    }
}

window.TEXTAREA_BACKUP={};

export class SafeTextarea extends Component {
    constructor(props) {
        super(props);
        this.state={
            text: window.TEXTAREA_BACKUP[props.id]||'',
        };
        this.on_change_bound=this.on_change.bind(this);
        this.clear=this.clear.bind(this);
        this.area_ref=React.createRef();
        this.change_callback=props.on_change;
        this.change_callback(this.state.text);
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

    clear() {
        this.setState({
            text: '',
        });
    }
    set_and_focus(text) {
        this.change_callback(text);
        this.setState({
            text: text,
        },()=>{
            this.area_ref.current.focus();
        });
    }
    get() {
        return this.state.text;
    }

    render() {
        return (
            <textarea ref={this.area_ref} onChange={this.on_change_bound} value={this.state.text} />
        )
    }
}

export function PromotionBar(props) {
    const is_ios=/iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    // noinspection JSConstructorReturnsPrimitive
    return is_ios ? (
        <div className="box promotion-bar">
            <span className="icon icon-about" />&nbsp;
            用 Safari 将本网站 <b>添加到主屏幕</b> 更好用
        </div>
    ) : null;
}