import React, {Component} from 'react';
import {ColorPicker} from './color_picker';
import {Time, TitleLine, AutoLink} from './Common.js';
import './Flows.css';
import LazyLoad from 'react-lazyload';
import {AudioWidget} from './AudioWidget.js';

const IMAGE_BASE='http://www.pkuhelper.com/services/pkuhole/images/';
const AUDIO_BASE='/audio_proxy/';
const API_BASE=window.location.protocol==='https:' ? '/api_proxy' : 'http://www.pkuhelper.com:10301/services/pkuhole';

const SEARCH_PAGESIZE=50;
const CLICKABLE_TAGS={a: true, audio: true};
const PREVIEW_REPLY_COUNT=10;

function Reply(props) {
    return (
        <div className={'flow-reply box'} style={props.info._display_color ? {
            backgroundColor: props.info._display_color,
        } : null}>
            <div className="box-header">
                <span className="box-id">#{props.info.cid}</span>&nbsp;
                <Time stamp={props.info.timestamp} />
            </div>
            <AutoLink text={props.info.text} />
        </div>
    );
}

function FlowItem(props) {
    return (
        <div className="flow-item box">
            <div className="box-header">
                {!!parseInt(props.info.likenum,10) && <span className="box-header-badge">{props.info.likenum}★</span>}
                {!!parseInt(props.info.reply,10) && <span className="box-header-badge">{props.info.reply}回复</span>}
                <span className="box-id">#{props.info.pid}</span>&nbsp;
                <Time stamp={props.info.timestamp} />
            </div>
            <AutoLink text={props.info.text} />
            {props.info.type==='image' ? <img src={IMAGE_BASE+props.info.url} /> : null}
            {props.info.type==='audio' ? <AudioWidget src={AUDIO_BASE+props.info.url} /> : null}
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
        this.color_picker=new ColorPicker();
    }

    componentDidMount() {
        if(parseInt(this.info.reply,10)) {
            this.setState({
                reply_loading: true,
            });
            this.load_replies();
        }
    }

    load_replies() {
        console.log('fetching reply',this.info.pid);
        fetch(API_BASE+'/api.php?action=getcomment&pid='+this.info.pid)
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(json.code);
                this.setState({
                    replies: json.data
                        .sort((a,b)=>{
                            return parseInt(a.timestamp,10)-parseInt(b.timestamp,10);
                        })
                        .map((info)=>{
                            info._display_color=info.islz ? null : this.color_picker.get(info.name)
                            return info;
                        }),
                    reply_loading: false,
                });
            });
    }

    render() {
        // props.do_show_details
        return (
            <div className="flow-item-row" onClick={(event)=>{
                if(!CLICKABLE_TAGS[event.target.tagName.toLowerCase()])
                    this.props.callback(
                        '帖子详情',
                        <div className="flow-item-row sidebar-flow-item">
                            <FlowItem info={this.info} />
                            {this.state.replies.map((reply)=><Reply info={reply} key={reply.cid} />)}
                        </div>
                    );
            }}>
                <FlowItem info={this.info} />
                <div className="flow-reply-row">
                    {!!this.state.reply_loading && <div className="box box-tip">加载中</div>}
                    {this.state.replies.slice(0,PREVIEW_REPLY_COUNT).map((reply)=><Reply info={reply} key={reply.cid} />)}
                    {this.state.replies.length>PREVIEW_REPLY_COUNT && <div className="box box-tip">
                        还有 {this.state.replies.length-PREVIEW_REPLY_COUNT} 条
                    </div>}
                </div>
            </div>
        );
    }
}

function FlowChunk(props) {
    return (
        <div className="flow-chunk">
            <TitleLine text={props.title} />
            {props.list.map((info)=>(
                <LazyLoad key={info.pid} offset={500} height="15em">
                    <FlowItemRow info={info} callback={props.callback} />
                </LazyLoad>
            ))}
        </div>
    );
}

export class Flow extends Component {
    constructor(props) {
        super(props);
        this.state={
            mode: (
                props.search_text===null ? 'list' :
                props.search_text.charAt(0)==='#' ? 'single' :
                'search'
            ),
            search_param: props.search_text,
            loaded_pages: 0,
            chunks: [],
            loading: false,
        };
        this.on_scroll_bound=this.on_scroll.bind(this);
    }

    load_page(page) {
        if(page>this.state.loaded_pages+1)
            throw new Error('bad page');
        if(page===this.state.loaded_pages+1) {
            console.log('fetching page',page);
            if(this.state.mode==='list') {
                fetch(API_BASE+'/api.php?action=getlist&p='+page)
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json.code);
                        this.setState((prev,props)=>({
                            chunks: prev.chunks.concat([{
                                title: 'Page '+page,
                                data: json.data.filter((x)=>(
                                    prev.chunks.length===0 ||
                                    !(prev.chunks[prev.chunks.length-1].data.some((p)=>p.pid===x.pid))
                                )),
                            }]),
                            loading: false,
                        }));
                    })
                    .catch((err)=>{
                        console.trace(err);
                        alert('load failed');
                    });
            } else if(this.state.mode==='search') {
                fetch(
                    API_BASE+'/api.php?action=search'+
                    '&pagesize='+SEARCH_PAGESIZE*page+
                    '&keywords='+encodeURIComponent(this.state.search_param)
                )
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json.code);
                        const finished=json.data.length<SEARCH_PAGESIZE;
                        this.setState({
                            chunks: [{
                                title: 'Result for "'+this.state.search_param+'"',
                                data: json.data,
                                mode: finished ? 'search_finished' : 'search',
                            }],
                            loading: false,
                        });
                    })
                    .catch((err)=>{
                        console.trace(err);
                        alert('load failed');
                    });
            } else if(this.state.mode==='single') {
                const pid=parseInt(this.state.search_param.substr(1),10);
                fetch(
                    API_BASE+'/api.php?action=getone'+
                    '&pid='+pid
                )
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json.code);
                        this.setState({
                            chunks: [{
                                title: 'PID = '+pid,
                                data: [json.data],
                            }],
                            mode: 'single_finished',
                            loading: false,
                        });
                    })
                    .catch((err)=>{
                        console.trace(err);
                        alert('load failed');
                    });
            } else {
                console.log('nothing to load');
                return;
            }
            this.setState((prev,props)=>({
                loaded_pages: prev.loaded_pages+1,
                loading: true,
            }));
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
        this.load_page(1);
        window.addEventListener('scroll',this.on_scroll_bound);
        window.addEventListener('resize',this.on_scroll_bound);
    }
    componentWillUnmount() {
        window.removeEventListener('scroll',this.on_scroll_bound);
        window.removeEventListener('resize',this.on_scroll_bound);
    }

    render() {
        return (
            <div className="flow-container">
                {this.state.chunks.map((chunk)=>(
                    <FlowChunk title={chunk.title} list={chunk.data} key={chunk.title} callback={this.props.callback} />
                ))}
                <TitleLine text={this.state.loading ? 'Loading...' : '© xmcp'} />
            </div>
        );
    }
}