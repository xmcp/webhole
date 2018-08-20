import React, {Component} from 'react';
import './ControlBar.css';

export class ControlBar extends Component {
    constructor(props) {
        super(props);
        this.state={
            search_text: '',
        };
        this.set_search_text=props.set_search_text;
    }

    on_change(event) {
        this.setState({
            search_text: event.target.value,
        });
    }

    on_keypress(event) {
        if(event.key==='Enter')
            this.set_search_text(this.state.search_text);
    }

    do_refresh() {
        this.setState({
            search_text: '',
        });
        this.set_search_text(null);
    }

    render() {
        return (
            <div className="control-bar aux-margin">
                <a className="refresh-btn" onClick={this.do_refresh.bind(this)}>最新树洞</a>
                &nbsp;
                <input value={this.state.search_text} placeholder="搜索"
                    onChange={this.on_change.bind(this)} onKeyPress={this.on_keypress.bind(this)}
                />
            </div>
        )
    }
}