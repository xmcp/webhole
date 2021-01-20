import React, {Component, PureComponent} from 'react';
import './Sidebar.css';

export class Sidebar extends PureComponent {
    constructor(props) {
        super(props);
        this.sidebar_ref=React.createRef();
        this.do_close_bound=this.do_close.bind(this);
        this.do_back_bound=this.do_back.bind(this);
    }

    componentDidUpdate(nextProps) {
        if(this.props.stack!==nextProps.stack) {
            //console.log('sidebar top');
            if(this.sidebar_ref.current)
                this.sidebar_ref.current.scrollTop=0;
        }
    }

    do_close() {
        this.props.show_sidebar(null,null,'clear');
    }
    do_back() {
        this.props.show_sidebar(null,null,'pop');
    }

    render() {
        let [cur_title,cur_content]=this.props.stack[this.props.stack.length-1];
        return (
            <div className={'sidebar-container '+(cur_title!==null ? 'sidebar-on' : 'sidebar-off')}>
                <div className="sidebar-shadow" onClick={this.do_back_bound} onTouchEnd={(e)=>{e.preventDefault();e.target.click();}} />
                <div ref={this.sidebar_ref} className="sidebar">
                    {cur_content}
                </div>
                <div className="sidebar-title">
                    <a className="no-underline" onClick={this.do_close_bound}>&nbsp;<span className="icon icon-close" />&nbsp;</a>
                    {this.props.stack.length>2 &&
                        <a className="no-underline" onClick={this.do_back_bound}>&nbsp;<span className="icon icon-back" />&nbsp;</a>
                    }
                    {cur_title}
                </div>
            </div>
        );
    }
}