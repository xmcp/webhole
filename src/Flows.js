import React, {Component, PureComponent} from 'react';
import {ColorPicker} from './color_picker';
import {Time, TitleLine, HighlightedText} from './Common';
import './Flows.css';
import LazyLoad from 'react-lazyload';
import {AudioWidget} from './AudioWidget';
import {TokenCtx, ReplyForm} from './UserAction';

import {API_BASE} from './Common';
const IMAGE_BASE='http://www.pkuhelper.com/services/pkuhole/images/';
const AUDIO_BASE='/audio_proxy/';

const SEARCH_PAGESIZE=50;
const CLICKABLE_TAGS={a: true, audio: true};
const PREVIEW_REPLY_COUNT=10;

window.LATEST_POST_ID=parseInt(localStorage['_LATEST_POST_ID'],10)||0;

function Reply(props) {
    return (
        <div className={'flow-reply box'} style={props.info._display_color ? {
            backgroundColor: props.info._display_color,
        } : null}>
            <div className="box-header">
                <code className="box-id">#{props.info.cid}</code>&nbsp;
                <Time stamp={props.info.timestamp} />
            </div>
            <HighlightedText text={props.info.text} color_picker={props.color_picker} />
        </div>
    );
}

function FlowItem(props) {
    return (
        <div className="flow-item box">
            {parseInt(props.info.pid,10)>window.LATEST_POST_ID && <div className="flow-item-dot" /> }
            <div className="box-header">
                {!!parseInt(props.info.likenum,10) &&
                    <span className="box-header-badge">
                        {props.info.likenum}&nbsp;
                        <span className={'icon icon-'+(props.attention ? 'star-ok' : 'star')} />
                    </span>
                }
                {!!parseInt(props.info.reply,10) &&
                    <span className="box-header-badge">
                        {props.info.reply}&nbsp;
                        <span className="icon icon-reply" />
                    </span>
                }
                <code className="box-id">#{props.info.pid}</code>&nbsp;
                <Time stamp={props.info.timestamp} />
            </div>
            <HighlightedText text={props.info.text} color_picker={props.color_picker} />
            {props.info.type==='image' ? <p className="img"><img src={IMAGE_BASE+props.info.url} /></p> : null}
            {props.info.type==='audio' ? <AudioWidget src={AUDIO_BASE+props.info.url} /> : null}
        </div>
    );
}

class FlowItemRow extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            replies: [],
            reply_status: 'done',
            info: props.info,
            attention: false,
        };
        this.color_picker=new ColorPicker();
    }

    componentDidMount() {
        if(parseInt(this.state.info.reply,10)) {
            this.load_replies();
        }
    }

    load_replies(callback) {
        console.log('fetching reply',this.state.info.pid);
        this.setState({
            reply_status: 'loading',
        });
        const token_param=this.props.token ? '&token='+this.props.token : '';
        fetch(
            API_BASE+'/api.php?action=getcomment'+
            '&pid='+this.state.info.pid+
            token_param
        )
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(json);
                const replies=json.data
                    .sort((a,b)=>{
                        return parseInt(a.timestamp,10)-parseInt(b.timestamp,10);
                    })
                    .map((info)=>{
                        info._display_color=this.color_picker.get(info.name);
                        return info;
                    });
                this.setState((prev,props)=>({
                    replies: replies,
                    info: Object.assign({}, prev.info, {
                        reply: ''+replies.length,
                    }),
                    attention: !!json.attention,
                    reply_status: 'done',
                }),callback);
            })
            .catch((e)=>{
                console.trace(e);
                this.setState({
                    replies: [],
                    reply_status: 'failed',
                },callback);
            });
    }

    toggle_attention(callback) {
        let data=new URLSearchParams();
        const next_attention=!this.state.attention;
        data.append('token', this.props.token);
        data.append('pid', this.state.info.pid);
        data.append('switch', next_attention ? '1' : '0');
        fetch(API_BASE+'/api.php?action=attention', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0 && (!json.msg || json.msg!=='已经关注过辣'))
                    throw new Error(json);

                this.setState({
                    attention: next_attention,
                }, callback);
            })
            .catch((e)=>{
                alert('设置关注失败');
                console.trace(e);
                callback();
            });
    }

    reload_sidebar() {
        this.props.show_sidebar('帖子详情',<p className="box box-tip">加载中……</p>);
        this.load_replies(this.show_sidebar.bind(this));
    }

    show_sidebar() {
        this.props.show_sidebar(
            '帖子详情',
            <div className="flow-item-row sidebar-flow-item">
                <div className="box box-tip">
                    <a onClick={this.reload_sidebar.bind(this)}>刷新回复</a>
                    {this.props.token &&
                        <span>
                            &nbsp;/&nbsp;
                            <a onClick={()=>{
                                this.props.show_sidebar('帖子详情',<p className="box box-tip">加载中……</p>);
                                this.toggle_attention(this.show_sidebar.bind(this));
                            }}>
                                {this.state.attention ?
                                    <span><span className="icon icon-star-ok" />已关注</span> :
                                    <span><span className="icon icon-star" />未关注</span>
                                }
                            </a>
                        </span>
                    }
                </div>
                <FlowItem info={this.state.info} color_picker={this.color_picker} attention={this.state.attention} />
                {this.state.replies.map((reply)=>(
                    <LazyLoad key={reply.cid} offset={500} height="5em" overflow={true} once={true}>
                        <Reply info={reply} color_picker={this.color_picker} />
                    </LazyLoad>
                ))}
                {this.props.token &&
                    <ReplyForm pid={this.state.info.pid} token={this.props.token} on_complete={this.reload_sidebar.bind(this)} />
                }
            </div>
        );
    }

    render() {
        // props.do_show_details
        return (
            <div className="flow-item-row" onClick={(event)=>{
                if(!CLICKABLE_TAGS[event.target.tagName.toLowerCase()])
                    this.show_sidebar();
            }}>
                <FlowItem info={this.state.info} color_picker={this.color_picker} attention={this.state.attention} />
                <div className="flow-reply-row">
                    {this.state.reply_status==='loading' && <div className="box box-tip">加载中</div>}
                    {this.state.reply_status==='failed' &&
                        <div className="box box-tip"><a onClick={()=>{this.load_replies()}}>重新加载</a></div>
                    }
                    {this.state.replies.slice(0,PREVIEW_REPLY_COUNT).map((reply)=>(
                        <Reply key={reply.cid} info={reply} color_picker={this.color_picker} />
                    ))}
                    {this.state.replies.length>PREVIEW_REPLY_COUNT &&
                        <div className="box box-tip">还有 {this.state.replies.length-PREVIEW_REPLY_COUNT} 条</div>
                    }
                </div>
            </div>
        );
    }
}

function FlowChunk(props) {
    return (
        <TokenCtx.Consumer>{({value: token})=>(
            <div className="flow-chunk">
                <TitleLine text={props.title} />
                {props.list.map((info)=>(
                    <LazyLoad key={info.pid} offset={500} height="15em" once={true} >
                        <FlowItemRow info={info} show_sidebar={props.show_sidebar} token={token} />
                    </LazyLoad>
                ))}
            </div>
        )}</TokenCtx.Consumer>
    );
}

export class Flow extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            mode: props.mode,
            search_param: props.search_text,
            loaded_pages: 0,
            chunks: [],
            loading_status: 'done',
        };
        this.on_scroll_bound=this.on_scroll.bind(this);
        window.LATEST_POST_ID=parseInt(localStorage['_LATEST_POST_ID'],10)||0;
    }

    load_page(page) {
        const failed=(err)=>{
            console.trace(err);
            this.setState((prev,props)=>({
                loaded_pages: prev.loaded_pages-1,
                loading_status: 'failed',
            }));
        };

        const token_param=this.props.token ? '&token='+this.props.token : '';

        if(page>this.state.loaded_pages+1)
            throw new Error('bad page');
        if(page===this.state.loaded_pages+1) {
            console.log('fetching page',page);
            if(this.state.mode==='list') {
                fetch(
                    API_BASE+'/api.php?action=getlist'+
                    '&p='+page+
                    token_param
                )
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json);
                        json.data.forEach((x)=>{
                            if(parseInt(x.pid,10)>(parseInt(localStorage['_LATEST_POST_ID'],10)||0))
                                localStorage['_LATEST_POST_ID']=x.pid;
                        });
                        this.setState((prev,props)=>({
                            chunks: prev.chunks.concat([{
                                title: 'Page '+page,
                                data: json.data.filter((x)=>(
                                    prev.chunks.length===0 ||
                                    !(prev.chunks[prev.chunks.length-1].data.some((p)=>p.pid===x.pid))
                                )),
                            }]),
                            loading_status: 'done',
                        }));
                    })
                    .catch(failed);
            } else if(this.state.mode==='search') {
                fetch(
                    API_BASE+'/api.php?action=search'+
                    '&pagesize='+SEARCH_PAGESIZE*page+
                    '&keywords='+encodeURIComponent(this.state.search_param)+
                    token_param
                )
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json);
                        const finished=json.data.length<SEARCH_PAGESIZE;
                        this.setState({
                            chunks: [{
                                title: 'Result for "'+this.state.search_param+'"',
                                data: json.data,
                            }],
                            mode: finished ? 'search_finished' : 'search',
                            loading_status: 'done',
                        });
                    })
                    .catch(failed);
            } else if(this.state.mode==='single') {
                const pid=parseInt(this.state.search_param.substr(1),10);
                fetch(
                    API_BASE+'/api.php?action=getone'+
                    '&pid='+pid+
                    token_param
                )
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json);
                        this.setState({
                            chunks: [{
                                title: 'PID = '+pid,
                                data: [json.data],
                            }],
                            mode: 'single_finished',
                            loading_status: 'done',
                        });
                    })
                    .catch(failed);
            } else if(this.state.mode==='attention') {
                fetch(
                    API_BASE+'/api.php?action=getattention'+
                    token_param
                )
                    .then((res)=>res.json())
                    .then((json)=>{
                        if(json.code!==0)
                            throw new Error(json);
                        this.setState({
                            chunks: [{
                                title: 'Attention List',
                                data: json.data,
                            }],
                            mode: 'attention_finished',
                            loading_status: 'done',
                        });
                    })
                    .catch(failed);
            } else {
                console.log('nothing to load');
                return;
            }

            this.setState((prev,props)=>({
                loaded_pages: prev.loaded_pages+1,
                loading_status: 'loading',
            }));
        }
    }

    on_scroll(event) {
        if(event.target===document) {
            const avail=document.body.scrollHeight-window.scrollY-window.innerHeight;
            if(avail<window.innerHeight && this.state.loading_status==='done')
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
                    <FlowChunk title={chunk.title} list={chunk.data} key={chunk.title} show_sidebar={this.props.show_sidebar} />
                ))}
                {this.state.loading_status==='failed' &&
                    <div className="box box-tip">
                        <a onClick={()=>{this.load_page(this.state.loaded_pages+1)}}>重新加载</a>
                    </div>
                }
                <TitleLine text={this.state.loading_status==='loading' ? 'Loading...' : '© xmcp'} />
            </div>
        );
    }
}