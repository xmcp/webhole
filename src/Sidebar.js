import React, {Component, PureComponent} from 'react';
import './Sidebar.css';

export class Sidebar extends PureComponent {
    constructor(props) {
        super(props);
        this.sidebar_ref=React.createRef();
    }

    componentWillReceiveProps(nextProps) {
        //console.log('sidebar top');
        this.sidebar_ref.current.scrollTo(0,0);
    }

    render() {
        return (
            <div className={this.props.title!==null ? 'sidebar-on' : ''}>
                <div className="sidebar-shadow" onClick={this.props.do_close} />
                <div ref={this.sidebar_ref} className="sidebar">
                    {this.props.content}
                </div>
                <div className="sidebar-title">
                    <a onClick={this.props.do_close}>&nbsp;<span className="icon icon-back" />&nbsp;</a>
                    {this.props.title}
                </div>
            </div>
        );
    }
}