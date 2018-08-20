import React, {Component} from 'react';
import './Sidebar.css';

export function Sidebar(props) {
    return (
        <div className={props.content ? 'sidebar-on' : ''}>
            <div className="sidebar-shadow" onClick={props.do_close} />
            <div className="sidebar">
                <p>
                    <a onClick={props.do_close}>×</a>
                    &nbsp;{props.title}
                </p>
                <hr />
                {props.content}
            </div>
        </div>
    );
}