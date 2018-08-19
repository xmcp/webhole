import React, {Component} from 'react';
import TimeAgo from 'react-timeago';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';
import './Common.css';

const chinese_format=buildFormatter(chineseStrings);

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

export function CenteredLine(props) {
    return (
        <p className="centered-line">
            <span>{props.text}</span>
        </p>
    )
}