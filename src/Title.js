import React, {Component} from 'react';
import './Title.css';

const tos=`P大树洞网页版

使用本网站时，您需要了解并同意：

- 所有数据来自 PKU Helper，本站不对其内容负责
- 不接受关于修改 UI 的建议
- 英梨梨是我的，你们都不要抢`;

export function Title(props) {
    return (
        <div className="title">
            <div className="title-links">
                <a onClick={()=>{alert(tos);}}>ToS</a>
                <a href="https://github.com/xmcp/ashole">GitHub</a>
            </div>
            P大树洞
        </div>
    )
}