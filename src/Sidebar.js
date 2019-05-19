import React, {Component} from 'react';
import './Sidebar.css';

export function Sidebar(props) {
    return (
        <div className={props.content ? 'sidebar-on' : ''}>
            <div className="sidebar-shadow" onClick={props.do_close} />
            <div className="sidebar">
                <div className="sidebar-title">
                    <a onClick={props.do_close}>&nbsp;<span className="icon icon-back" />&nbsp;</a>
                    {props.title}
                </div>
                <div className="sidebar-content">
                    {props.content}
                </div>
            </div>
        </div>
    );
}