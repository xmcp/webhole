import React, {Component} from 'react';
import './Title.css';

const HELP_TEXT=(
    <div className="box">
        <p>使用提示：</p>
        <ul>
            <li>为保证使用体验，请使用 Chrome 浏览器 stable 分支最新版</li>
            <li>在列表中点击帖子可以显示全部回复</li>
            <li>搜索框输入 #472865 等可以查看指定 ID 的树洞</li>
        </ul>
        <p>使用本网站时，您需要了解并同意：</p>
        <ul>
            <li>所有数据来自 PKU Helper，本站不对其内容负责</li>
            <li>不接受关于修改 UI 的建议</li>
            <li>英梨梨是我的，你们都不要抢</li>
        </ul>
        <p>By @xmcp</p>
        <br />
        <p>
            This program is free software: you can redistribute it and/or modify
            it under the terms of the GNU General Public License as published by
            the Free Software Foundation, either version 3 of the License, or
            (at your option) any later version.
        </p>
        <br />
        <p>
            This program is distributed in the hope that it will be useful,
            but WITHOUT ANY WARRANTY; without even the implied warranty of
            MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
            GNU General Public License for more details.
        </p>
    </div>
);

class ControlBar extends Component {
    constructor(props) {
        super(props);
        this.state={
            search_text: '',
        };
        this.set_search_text=props.set_search_text;
    }

    componentDidMount() {
        if(window.location.hash) {
            const text=window.location.hash.substr(1);
            this.setState({
                search_text: text,
            });
            this.set_search_text(text);
        }
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
        window.scrollTo(0,0);
        this.setState({
            search_text: '',
        });
        this.set_search_text(null);

    }

    render() {
        return (
            <div className="control-bar">
                <a className="refresh-btn" onClick={this.do_refresh.bind(this)}>最新树洞</a>
                &nbsp;
                <input value={this.state.search_text} placeholder="搜索 或 #PID"
                       onChange={this.on_change.bind(this)} onKeyPress={this.on_keypress.bind(this)}
                />
                &nbsp;
                <a onClick={()=>{this.props.callback(
                    '关于 P大树洞（非官方） 网页版',
                    HELP_TEXT
                )}}>Help</a>
                <a href="https://github.com/xmcp/ashole" target="_blank">GitHub</a>
            </div>
        )
    }
}

export function Title(props) {
    return (
        <div className="title-bar">
            <div className="aux-margin">
                <p className="title centered-line">P大树洞</p>
                <ControlBar callback={props.callback} set_search_text={props.set_search_text} />
            </div>
        </div>
    )
}