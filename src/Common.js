import React, {Component, PureComponent} from 'react';

import TimeAgo from 'react-timeago';
import Linkify from 'react-linkify';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './Common.css';

const chinese_format=buildFormatter(chineseStrings);

const PID_RE=/(^|[^\d])([1-9]\d{4,5})(?!\d)/g;
const NICKNAME_RE=/(^|[^A-Za-z])((?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Japanese|Kind|Little|Magic|Naïve|Old|Powerful|Quiet|Rich|Superman|THU|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win|洞主)(?![A-Za-z])/gi;

function pad2(x) {
    return x<10 ? '0'+x : ''+x;
}

export function Time(props) {
    const time=new Date(props.stamp*1000);
    return (
        <span>
            <TimeAgo date={time} formatter={chinese_format} />
            &nbsp;
            {time.getMonth()+1}-{time.getDate()}&nbsp;
            {time.getHours()}:{pad2(time.getMinutes())}
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
        let parts=[].concat.apply([], props.text.split(PID_RE).map((p)=>p.split(NICKNAME_RE)));
        return (
            <Linkify properties={{target: '_blank'}}>
                <pre>
                    {parts.map((p,idx)=>(
                        <span key={idx}>{
                            PID_RE.test(p) ? <a href={'##'+p} target="_blank">{p}</a> :
                            NICKNAME_RE.test(p) ? <span style={{backgroundColor: props.color_picker.get(p)}}>{p}</span> :
                            p
                        }</span>
                    ))}
                </pre>
            </Linkify>
        )
    }
}
