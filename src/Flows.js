import React, {Component} from 'react';
import {Time, CenteredLine} from './Common.js';
import './Flows.css';

const IMAGE_BASE='http://www.pkuhelper.com/services/pkuhole/images/';
const AUDIO_BASE='http://www.pkuhelper.com/services/pkuhole/audios/';

function Reply(props) {
    return (
        <div className={'flow-reply box '+(props.info.islz ? '' : 'flow-reply-gray')}>
            <div className="box-header">
                <span className="box-id">#{props.info.cid}</span>&nbsp;
                <Time stamp={props.info.timestamp} />
            </div>
            <pre>{props.info.text}</pre>
        </div>
    );
}

function ReplyPlaceholder(props) {
    return (
        <div className="box">
            正在加载 {props.count} 条回复
        </div>
    );
}

class FlowChunkItem extends Component {
    constructor(props) {
        super(props);
        this.state={
            replies: [],
            reply_loading: false,
        };
        this.info=props.info;
        if(props.info.reply) {
            this.state.reply_loading=true;
            this.load_replies();
        }
    }

    load_replies() {
        fetch('http://www.pkuhelper.com:10301/pkuhelper/../services/pkuhole/api.php?action=getcomment&pid='+this.info.pid)
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(json.code);
                this.setState({
                    replies: json.data,
                    reply_loading: false,
                });
            });
    }

    render() {
        // props.do_show_details
        return (
            <div className="flow-item-row">
                <div className="flow-item box">
                    <div className="box-header">
                        <span className="box-header-badge">{this.info.likenum} 赞</span>
                        <span className="box-header-badge">{this.info.reply} 回复</span>
                        <span className="box-id">#{this.info.pid}</span>&nbsp;
                        <Time stamp={this.info.timestamp} />
                    </div>
                    <pre>{this.info.text}</pre>
                    {this.info.type==='image' ? <img src={IMAGE_BASE+this.info.url} /> : null}
                    {this.info.type==='audio' ? <audio src={AUDIO_BASE+this.info.url} /> : null}
                </div>
                {this.state.reply_loading && <ReplyPlaceholder count={this.info.reply} />}
                {this.state.replies.map((reply)=><Reply info={reply} key={reply.cid} />)}
            </div>
        );
    }
}

function FlowChunk(props) {
    return (
        <div className="flow-chunk">
            <CenteredLine text={props.title} />
            {props.list.map((info)=><FlowChunkItem key={info.pid} info={info} callback={props.callback} />)}
        </div>
    );
}

export class Flow extends Component {
    constructor(props) {
        super(props);
        this.state={
            mode: props.mode,
            loaded_pages: 0,
            chunks: []
        };
        this.load_page(1);
    }

    load_page(page) {
        if(page>this.state.loaded_pages+1)
            throw new Error('bad page');
        if(page===this.state.loaded_pages+1) {
            console.log('fetching page',page);
            this.setState((prev,props)=>({
                loaded_pages: prev.loaded_pages+1
            }));
            fetch('http://www.pkuhelper.com:10301/pkuhelper/../services/pkuhole/api.php?action=getlist&p='+page)
                .then((res)=>res.json())
                .then((json)=>{
                    if(json.code!==0)
                        throw new Error(json.code);
                    this.setState((prev,props)=>({
                        chunks: prev.chunks.concat([{
                            title: 'Page '+page,
                            data: json.data,
                        }])
                    }));
                })
                .catch((err)=>{
                    console.trace(err);
                    alert('load failed');
                });
        }
    }

    render() {
        return (
            <div className="flow-container">
                {this.state.chunks.map((chunk)=>(
                    <FlowChunk title={chunk.title} list={chunk.data} key={chunk.title} callback={this.props.callback} />
                ))}
            </div>
        );
    }
}