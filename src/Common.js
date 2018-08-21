import React, {Component} from 'react';

import TimeAgo from 'react-timeago';
import Linkify, {linkify} from 'react-linkify';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';

import './Common.css';

const chinese_format=buildFormatter(chineseStrings);
const PID_RE_TEXT=/(?:^|[^\d])(\d{5,6})(?!\d)/g;

linkify.add('#', {
    validate: /^(\d{5,6})/,
    normalize: (match) => {
        match.url='#'+match.url;
    },
});

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

export function AutoLink(props) {
    return (
        <Linkify properties={{target: '_blank'}}>
            <pre>{props.text.replace(new RegExp(PID_RE_TEXT,'g'),' #$1 ')}</pre>
        </Linkify>
    )
}