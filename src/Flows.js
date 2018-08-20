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

function FlowItem(props) {
    return (
        <div className="flow-item box">
            <div className="box-header">
                {parseInt(props.info.likenum, 10) && <span className="box-header-badge">{props.info.likenum}★</span>}
                {parseInt(props.info.reply, 10) && <span className="box-header-badge">{props.info.reply} 回复</span>}
                <span className="box-id">#{props.info.pid}</span>&nbsp;
                <Time stamp={props.info.timestamp} />
            </div>
            <pre>{props.info.text}</pre>
            {props.info.type==='image' ? <img src={IMAGE_BASE+props.info.url} /> : null}
            {props.info.type==='audio' ? <audio src={AUDIO_BASE+props.info.url} /> : null}
        </div>
    );
}

class FlowItemRow extends Component {
    constructor(props) {
        super(props);
        this.state={
            replies: [],
            reply_loading: false,
        };
        this.info=props.info;
        if(parseInt(props.info.reply,10)) {
            this.state.reply_loading=true;
            this.load_replies();
        }
    }

    load_replies() {
        console.log('fetching reply',this.info.pid);
        fetch('http://www.pkuhelper.com:10301/pkuhelper/../services/pkuhole/api.php?action=getcomment&pid='+this.info.pid)
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(json.code);
                this.setState({
                    replies: json.data.slice(0,10),
                    reply_loading: false,
                });
            });
    }

    render() {
        // props.do_show_details
        return (
            <div className="flow-item-row" onClick={()=>{this.props.callback(
                '帖子详情',
                <div className="flow-item-row sidebar-flow-item">
                    <FlowItem info={this.info} />
                    {this.state.replies.map((reply)=><Reply info={reply} key={reply.cid} />)}
                </div>
            )}}>
                <FlowItem info={this.info} />
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
            {props.list.map((info)=><FlowItemRow key={info.pid} info={info} callback={props.callback} />)}
        </div>
    );
}

export class Flow extends Component {
    constructor(props) {
        super(props);
        this.state={
            mode: props.mode,
            loaded_pages: 0,
            chunks: [],
            loading: false,
        };
        setTimeout(this.load_page.bind(this,1), 0);
    }

    load_page(page) {
        if(page>this.state.loaded_pages+1)
            throw new Error('bad page');
        if(page===this.state.loaded_pages+1) {
            console.log('fetching page',page);
            this.setState((prev,props)=>({
                loaded_pages: prev.loaded_pages+1,
                loading: true,
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
                        }]),
                        loading: false,
                    }));
                })
                .catch((err)=>{
                    console.trace(err);
                    alert('load failed');
                });
        }
    }

    on_scroll(event) {
        if(event.target===document) {
            //console.log(event);
            const avail=document.body.scrollHeight-window.scrollY-window.innerHeight;
            if(avail<window.innerHeight && this.state.loading===false)
                this.load_page(this.state.loaded_pages+1);
        }
    }

    componentDidMount() {
        window.addEventListener('scroll',this.on_scroll.bind(this));
        window.addEventListener('resize',this.on_scroll.bind(this));
    }
    componentWillUnmount() {
        window.removeEventListener('scroll',this.on_scroll.bind(this));
        window.removeEventListener('resize',this.on_scroll.bind(this));
    }

    render() {
        return (
            <div className="flow-container">
                {this.state.chunks.map((chunk)=>(
                    <FlowChunk title={chunk.title} list={chunk.data} key={chunk.title} callback={this.props.callback} />
                ))}
                <CenteredLine text={this.state.loading ? 'Loading More...' : '© xmcp'} />
            </div>
        );
    }
}