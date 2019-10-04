import React, {Component, PureComponent} from 'react';
import './Sidebar.css';

export class Sidebar extends PureComponent {
    constructor(props) {
        super(props);
        this.sidebar_ref=React.createRef();
    }

    componentDidUpdate(nextProps) {
        if(this.props.content!==nextProps.content) {
            //console.log('sidebar top');
            if(this.sidebar_ref.current)
                this.sidebar_ref.current.scrollTop=0;
        }
    }

    render() {
        return (
            <div className={this.props.title!==null ? 'sidebar-on' : ''}>
                <div className="sidebar-shadow" onClick={this.props.do_close} onTouchEnd={(e)=>{e.preventDefault();e.target.click();}} />
                <div ref={this.sidebar_ref} className="sidebar">
                    {this.props.content}
                </div>
                <div className="sidebar-title">
                    <a className="no-underline" onClick={this.props.do_close}>&nbsp;<span className="icon icon-back" />&nbsp;</a>
                    {this.props.title}
                </div>
            </div>
        );
    }
}