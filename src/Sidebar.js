import React, {Component} from 'react';
import './Sidebar.css';

export function Sidebar(props) {
    return (
        <div className={props.title!==null ? 'sidebar-on' : ''}>
            <div className="sidebar-shadow" onClick={props.do_close} />
            <div className="sidebar">
                {props.content}
            </div>
            <div className="sidebar-title">
                <a onClick={props.do_close}>&nbsp;<span className="icon icon-back" />&nbsp;</a>
                {props.title}
            </div>
        </div>
    );
}