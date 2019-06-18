import React, {Component, PureComponent} from 'react';
import copy from 'copy-to-clipboard';
import {ColorPicker} from './color_picker';
import {split_text,NICKNAME_RE,PID_RE,URL_RE} from './text_splitter';
import {format_time, build_highlight_re, Time, TitleLine, HighlightedText, ClickHandler} from './Common';
import './Flows.css';
import LazyLoad from './react-lazyload/src';
import {AudioWidget} from './AudioWidget';
import {TokenCtx, ReplyForm} from './UserAction';

import {API, PKUHELPER_ROOT} from './flows_api';

const IMAGE_BASE=PKUHELPER_ROOT+'services/pkuhole/images/';
const AUDIO_BASE=PKUHELPER_ROOT+'services/pkuhole/audios/';

const SEARCH_PAGESIZE=50;
const CLICKABLE_TAGS={a: true, audio: true};
const PREVIEW_REPLY_COUNT=10;
const QUOTE_BLACKLIST=['23333','233333','66666','666666','10086','10000','100000','99999','999999','55555','555555'];

window.LATEST_POST_ID=parseInt(localStorage['_LATEST_POST_ID'],10)||0;

function load_single_meta(show_sidebar,token,parents) {
    return (pid)=>{
        let title_elem=<FlowSidebarTitle pid={pid} parents={parents} show_sidebar={show_sidebar} token={token} />;
        const color_picker=new ColorPicker();
        show_sidebar(
            title_elem,
            <div className="box box-tip">
                正在加载 #{pid}
            </div>
        );
        Promise.all([
            API.get_single(pid,token),
            API.load_replies(pid,token,color_picker),
        ])
            .then((res)=>{
                const [single,replies]=res;
                single.data.variant={};
                show_sidebar(
                    title_elem,
                    <FlowSidebar
                        info={single.data} replies={replies.data} attention={replies.attention}
                        token={token} show_sidebar={show_sidebar} color_picker={color_picker}
                        deletion_detect={localStorage['DELETION_DETECT']==='on'} parents={parents}
                    />
                )
            })
            .catch((e)=>{
                console.error(e);
                show_sidebar(
                    title_elem,
                    <div className="box box-tip">
                        <p><a onClick={()=>load_single_meta(show_sidebar,token,parents)(pid)}>重新加载</a></p>
                        <p>{''+e}</p>
                    </div>
                );
            })
    };
}

class Reply extends PureComponent {
    constructor(props) {
        super(props);
    }

    render() {
        let parts=split_text(this.props.info.text,[
            ['url',URL_RE],
            ['pid',PID_RE],
            ['nickname',NICKNAME_RE],
        ]);
        return (
            <div className={'flow-reply box'} style={this.props.info._display_color ? {
                backgroundColor: this.props.info._display_color,
            } : null}>
                <div className="box-header">
                    <code className="box-id">#{this.props.info.cid}</code>&nbsp;
                    <Time stamp={this.props.info.timestamp} />
                </div>
                <div className="box-content">
                    <HighlightedText parts={parts} color_picker={this.props.color_picker} show_pid={this.props.show_pid} />
                </div>
            </div>
        );
    }
}

class FlowItem extends PureComponent {
    constructor(props) {
        super(props);
    }

    copy_link(event) {
        event.preventDefault();
        copy(
            `${event.target.href}\n`+
            `${this.props.info.text}${this.props.info.type==='image'?' [图片]':this.props.info.type==='audio'?' [语音]':''}\n`+
            `（${format_time(new Date(this.props.info.timestamp*1000))} ${this.props.info.likenum}关注 ${this.props.info.reply}回复）\n`+
            this.props.replies.map((r)=>(r.text)).join('\n')
        );
    }

    render() {
        let props=this.props;
        let parts=props.parts||split_text(props.info.text,[
            ['url',URL_RE],
            ['pid',PID_RE],
            ['nickname',NICKNAME_RE],
        ]);
        return (
            <div className={'flow-item'+(props.is_quote ? ' flow-item-quote' : '')}>
                {!!props.is_quote &&
                    <div className="quote-tip black-outline">
                        <div><span className="icon icon-quote" /></div>
                        <div><small>提到</small></div>
                    </div>
                }
                <div className="box">
                    {!!window.LATEST_POST_ID && parseInt(props.info.pid,10)>window.LATEST_POST_ID &&
                        <div className="flow-item-dot" />
                    }
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
                        <code className="box-id"><a href={'##'+props.info.pid} onClick={this.copy_link.bind(this)}>#{props.info.pid}</a></code>
                        &nbsp;
                        <Time stamp={props.info.timestamp} />
                    </div>
                    <div className="box-content">
                        <HighlightedText parts={parts} color_picker={props.color_picker} show_pid={props.show_pid} />
                        {props.info.type==='image' &&
                            <p className="img">
                                {props.img_clickable ?
                                    <a href={IMAGE_BASE+props.info.url} target="_blank"><img src={IMAGE_BASE+props.info.url} /></a> :
                                    <img src={IMAGE_BASE+props.info.url} />
                                }
                            </p>
                        }
                        {props.info.type==='audio' && <AudioWidget src={AUDIO_BASE+props.info.url} />}
                    </div>
                    {!!(props.attention && props.info.variant.latest_reply) &&
                        <p className="box-footer">最新回复 <Time stamp={props.info.variant.latest_reply} /></p>
                    }
                </div>
            </div>
        );
    }
}

class FlowSidebar extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            attention: props.attention,
            info: props.info,
            replies: props.replies,
            loading_status: 'done',
            error_msg: null,
        };
        this.color_picker=props.color_picker;
        this.syncState=props.sync_state||(()=>{});
        this.reply_ref=React.createRef();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            attention: nextProps.attention,
            info: nextProps.info,
            replies: nextProps.replies,
            loading_status: 'done',
        });
        this.color_picker=nextProps.color_picker;
        this.syncState=nextProps.sync_state||(()=>{});
    }

    set_variant(cid,variant) {
        this.setState((prev)=>{
            if(cid)
                return {
                    replies: prev.replies.map((reply)=>{
                        if(reply.cid===cid)
                            return Object.assign({},reply,{variant: Object.assign({},reply.variant,variant)});
                        else
                            return reply;
                    }),
                };
            else
                return {
                    info: Object.assign({},prev.info,{variant: Object.assign({},prev.info.variant,variant)}),
                }
        },function() {
            this.syncState({
                info: this.state.info,
                replies: this.state.replies,
            });
        });
    }

    load_replies(update_count=true) {
        this.setState({
            loading_status: 'loading',
            error_msg: null,
        });
        API.load_replies(this.state.info.pid,this.props.token,this.color_picker)
            .then((json)=>{
                this.setState((prev,props)=>({
                    replies: json.data,
                    info: update_count ? Object.assign({}, prev.info, {
                        reply: ''+json.data.length,
                    }) : prev.info,
                    attention: !!json.attention,
                    loading_status: 'done',
                    error_msg: null,
                }), ()=>{
                    this.syncState({
                        replies: this.state.replies,
                        attention: this.state.attention,
                        info: this.state.info,
                    });
                    if(this.state.replies.length)
                        this.set_variant(null,{latest_reply: Math.max.apply(null,this.state.replies.map((r)=>parseInt(r.timestamp)))});
                });
            })
            .catch((e)=>{
                console.error(e);
                this.setState({
                    replies: [],
                    loading_status: 'done',
                    error_msg: ''+e,
                });
            });
    }

    toggle_attention() {
        this.setState({
            loading_status: 'loading',
        });
        const next_attention=!this.state.attention;
        API.set_attention(this.state.info.pid,next_attention,this.props.token)
            .then((json)=>{
                this.setState({
                    loading_status: 'done',
                    attention: next_attention,
                });
                this.syncState({
                    attention: next_attention,
                });
            })
            .catch((e)=>{
                this.setState({
                    loading_status: 'done'
                });
                alert('设置关注失败');
                console.error(e);
            });
    }

    report() {
        let reason=prompt(`举报 #${this.state.info.pid} 的理由：`);
        if(reason!==null) {
            API.report(this.state.info.pid,reason,this.props.token)
                .then((json)=>{
                    alert('举报成功');
                })
                .catch((e)=>{
                    alert('举报失败');
                    console.error(e);
                })
        }
    }

    show_reply_bar(name,event) {
        if(this.reply_ref.current && !event.target.closest('a')) {
            let text=this.reply_ref.current.get();
            if(/^\s*(?:Re (?:|洞主|(?:[A-Z][a-z]+ )?(?:[A-Z][a-z]+)):)?\s*$/.test(text)) {// text is nearly empty so we can replace it
                let should_text='Re '+name+': ';
                if(should_text===this.reply_ref.current.get())
                    this.reply_ref.current.set('');
                else
                    this.reply_ref.current.set(should_text);
            }
        }
    }

    render() {
        if(this.state.loading_status==='loading')
            return (<p className="box box-tip">加载中……</p>);

        let show_pid=load_single_meta(this.props.show_sidebar,this.props.token,this.props.parents.concat([this.state.info.pid]));

        return (
            <div className="flow-item-row sidebar-flow-item">
                <div className="box box-tip">
                    {!!this.props.token &&
                        <span>
                            <a onClick={this.report.bind(this)}>举报</a>
                            &nbsp;/&nbsp;
                        </span>
                    }
                    <a onClick={this.load_replies.bind(this)}>刷新回复</a>
                    {!!this.props.token &&
                        <span>
                            &nbsp;/&nbsp;
                            <a onClick={()=>{
                                this.toggle_attention();
                            }}>
                                {this.state.attention ?
                                    <span><span className="icon icon-star-ok" />&nbsp;已关注</span> :
                                    <span><span className="icon icon-star" />&nbsp;未关注</span>
                                }
                            </a>
                        </span>
                    }
                </div>
                <ClickHandler callback={(e)=>{this.show_reply_bar('',e);}}>
                    <FlowItem info={this.state.info} attention={this.state.attention} img_clickable={true}
                        color_picker={this.color_picker} show_pid={show_pid} replies={this.state.replies}
                        set_variant={(variant)=>{this.set_variant(null,variant);}}
                    />
                </ClickHandler>
                {!!this.state.error_msg &&
                    <div className="box box-tip flow-item box-danger">
                        <p>回复加载失败</p>
                        <p>{this.state.error_msg}</p>
                    </div>
                }
                {(this.props.deletion_detect && parseInt(this.state.info.reply)>this.state.replies.length) && !!this.state.replies.length &&
                    <div className="box box-tip flow-item box-danger">
                        {parseInt(this.state.info.reply)-this.state.replies.length} 条回复被删除
                    </div>
                }
                {this.state.replies.map((reply)=>(
                    <LazyLoad key={reply.cid} offset={1500} height="5em" overflow={true} once={true}>
                        <ClickHandler callback={(e)=>{this.show_reply_bar(reply.name,e);}}>
                            <Reply
                                info={reply} color_picker={this.color_picker} show_pid={show_pid}
                                set_variant={(variant)=>{this.set_variant(reply.cid,variant);}}
                            />
                        </ClickHandler>
                    </LazyLoad>
                ))}
                {!!this.props.token ?
                    <ReplyForm pid={this.state.info.pid} token={this.props.token}
                               area_ref={this.reply_ref} on_complete={this.load_replies.bind(this)} /> :
                    <div className="box box-tip flow-item">登录后可以回复树洞</div>
                }
            </div>
        )
    }
}

function FlowSidebarTitle(props) {
    let last_pid=props.parents.length ? props.parents[props.parents.length-1] : null;
    return (
        <span>
            树洞&nbsp;
            {!!last_pid &&
                <span>
                    <a onClick={()=>load_single_meta(props.show_sidebar,props.token,props.parents.slice(0,-1))(last_pid)}>
                        #{last_pid}
                    </a>
                    &nbsp;→&nbsp;
                </span>
            }
            #{props.pid}
        </span>
    );
}

class FlowItemRow extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            replies: [],
            reply_status: 'done',
            info: Object.assign({},props.info,{variant: {}}),
            attention: false,
        };
        this.color_picker=new ColorPicker();
    }

    componentDidMount() {
        if(parseInt(this.state.info.reply,10)) {
            this.load_replies(null,/*update_count=*/false);
        }
    }

    load_replies(callback,update_count=true) {
        console.log('fetching reply',this.state.info.pid);
        this.setState({
            reply_status: 'loading',
        });
        API.load_replies(this.state.info.pid,this.props.token,this.color_picker)
            .then((json)=>{
                this.setState((prev,props)=>({
                    replies: json.data,
                    info: Object.assign({}, prev.info, {
                        reply: update_count ? ''+json.data.length : prev.info.reply,
                        variant: json.data.length ? {
                            latest_reply: Math.max.apply(null,json.data.map((r)=>parseInt(r.timestamp))),
                        } : {},
                    }),
                    attention: !!json.attention,
                    reply_status: 'done',
                }),callback);
            })
            .catch((e)=>{
                console.error(e);
                this.setState({
                    replies: [],
                    reply_status: 'failed',
                },callback);
            });
    }

    show_sidebar() {
        this.props.show_sidebar(
            <FlowSidebarTitle pid={this.state.info.pid} parents={[]} show_sidebar={this.props.show_sidebar} token={this.props.token} />,
            <FlowSidebar
                info={this.state.info} replies={this.state.replies} attention={this.state.attention} sync_state={this.setState.bind(this)}
                token={this.props.token} show_sidebar={this.props.show_sidebar} color_picker={this.color_picker}
                deletion_detect={this.props.deletion_detect} parents={[]}
            />
        );
    }

    render() {
        let show_pid=load_single_meta(this.props.show_sidebar,this.props.token,[this.state.info.pid]);

        let hl_rules=[
            ['url',URL_RE],
            ['pid',PID_RE],
            ['nickname',NICKNAME_RE],
        ];
        if(this.props.search_param)
            hl_rules.push(['search',build_highlight_re(this.props.search_param,' ')]);
        let parts=split_text(this.state.info.text,hl_rules);

        let quote_id=null;
        if(!this.props.is_quote && window.config.quote)
            for(let [mode,content] of parts)
                if(mode==='pid' && QUOTE_BLACKLIST.indexOf(content)===-1 && parseInt(content)<parseInt(this.state.info.pid))
                    if(quote_id===null)
                        quote_id=parseInt(content);
                    else {
                        quote_id=null;
                        break;
                    }

        let res=(
            <div className={'flow-item-row'+(this.props.is_quote ? ' flow-item-row-quote' : '')} onClick={(event)=>{
                if(!CLICKABLE_TAGS[event.target.tagName.toLowerCase()])
                    this.show_sidebar();
            }}>
                <FlowItem parts={parts} info={this.state.info} attention={this.state.attention} img_clickable={false} is_quote={this.props.is_quote}
                    color_picker={this.color_picker} show_pid={show_pid} replies={this.state.replies} />
                <div className={'flow-reply-row'+(window.config.horizontal_scroll ? '' : ' config-no-scroll')}>
                    {this.state.reply_status==='loading' && <div className="box box-tip">加载中</div>}
                    {this.state.reply_status==='failed' &&
                        <div className="box box-tip"><a onClick={()=>{this.load_replies()}}>重新加载</a></div>
                    }
                    {this.state.replies.slice(0,PREVIEW_REPLY_COUNT).map((reply)=>(
                        <Reply key={reply.cid} info={reply} color_picker={this.color_picker} show_pid={show_pid} />
                    ))}
                    {this.state.replies.length>PREVIEW_REPLY_COUNT &&
                        <div className="box box-tip">还有 {this.state.replies.length-PREVIEW_REPLY_COUNT} 条</div>
                    }
                </div>
            </div>
        );

        return quote_id ? (
            <div>
                {res}
                <FlowItemQuote pid={quote_id} show_sidebar={this.props.show_sidebar} token={this.props.token}
                    deletion_detect={this.props.deletion_detect} />
            </div>
        ) : res;
    }
}

class FlowItemQuote extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            loading_status: 'empty',
            error_msg: null,
            info: null,
        };
    }

    componentDidMount() {
        this.load();
    }

    load() {
        this.setState({
            loading_status: 'loading',
        },()=>{
            API.get_single(this.props.pid,this.props.token)
                .then((json)=>{
                    this.setState({
                        loading_status: 'done',
                        info: json.data,
                    });
                })
                .catch((err)=>{
                    if((''+err).indexOf('没有这条树洞')!==-1)
                        this.setState({
                            loading_status: 'empty',
                        });
                    else
                        this.setState({
                            loading_status: 'error',
                            error_msg: ''+err,
                        });
                });
        });
    }

    render() {
        if(this.state.loading_status==='empty')
            return null;
        else if(this.state.loading_status==='loading')
            return (
                <div className="box box-tip aux-margin">
                    <span className="icon icon-loading" />
                    提到了 #{this.props.pid}
                </div>
            );
        else if(this.state.loading_status==='error')
            return (
                <div className="box box-tip aux-margin">
                    <p><a onClick={this.load.bind(this)}>重新加载</a></p>
                    <p>{this.state.error_msg}</p>
                </div>
            );
        else // 'done'
            return (
                <FlowItemRow info={this.state.info} show_sidebar={this.props.show_sidebar} token={this.props.token}
                    is_quote={true} deletion_detect={this.props.deletion_detect} />
            );
    }
}

function FlowChunk(props) {
    return (
        <TokenCtx.Consumer>{({value: token})=>(
            <div className="flow-chunk">
                {!!props.title && <TitleLine text={props.title} />}
                {props.list.map((info,ind)=>(
                    <LazyLoad key={info.pid} offset={1500} height="15em" hiddenIfInvisible={true}>
                        <div>
                            {!!(props.deletion_detect && props.mode==='list' && ind && props.list[ind-1].pid-info.pid>1) &&
                                <div className="flow-item-row">
                                    <div className="box box-tip flow-item box-danger">
                                        {props.list[ind-1].pid-info.pid-1} 条被删除
                                    </div>
                                </div>
                            }
                            <FlowItemRow info={info} show_sidebar={props.show_sidebar} token={token}
                                    deletion_detect={props.deletion_detect} search_param={props.search_param} />
                        </div>
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
            chunks: {
                title: '',
                data: [],
            },
            loading_status: 'done',
            error_msg: null,
        };
        this.on_scroll_bound=this.on_scroll.bind(this);
        window.LATEST_POST_ID=parseInt(localStorage['_LATEST_POST_ID'],10)||0;
    }

    load_page(page) {
        const failed=(err)=>{
            console.error(err);
            this.setState((prev,props)=>({
                loaded_pages: prev.loaded_pages-1,
                loading_status: 'failed',
                error_msg: ''+err,
            }));
        };

        if(page>this.state.loaded_pages+1)
            throw new Error('bad page');
        if(page===this.state.loaded_pages+1) {
            console.log('fetching page',page);
            if(this.state.mode==='list') {
                API.get_list(page,this.props.token)
                    .then((json)=>{
                        if(page===1)
                            json.data.forEach((x)=>{
                                if(parseInt(x.pid,10)>(parseInt(localStorage['_LATEST_POST_ID'],10)||0))
                                    localStorage['_LATEST_POST_ID']=x.pid;
                            });
                        this.setState((prev,props)=>({
                            chunks: {
                                title: 'News Feed',
                                data: prev.chunks.data.concat(json.data.filter((x)=>(
                                    prev.chunks.data.length===0 ||
                                    !(prev.chunks.data.slice(-100).some((p)=>p.pid===x.pid))
                                ))),
                            },
                            loading_status: 'done',
                        }));
                    })
                    .catch(failed);
            } else if(this.state.mode==='search') {
                API.get_search(SEARCH_PAGESIZE*page,this.state.search_param,this.props.token)
                    .then((json)=>{
                        const finished=json.data.length<SEARCH_PAGESIZE;
                        this.setState({
                            chunks: {
                                title: 'Result for "'+this.state.search_param+'"',
                                data: json.data,
                            },
                            mode: finished ? 'search_finished' : 'search',
                            loading_status: 'done',
                        });
                    })
                    .catch(failed);
            } else if(this.state.mode==='single') {
                const pid=parseInt(this.state.search_param.substr(1),10);
                API.get_single(pid,this.props.token)
                    .then((json)=>{
                        this.setState({
                            chunks: {
                                title: 'PID = '+pid,
                                data: [json.data],
                            },
                            mode: 'single_finished',
                            loading_status: 'done',
                        });
                    })
                    .catch(failed);
            } else if(this.state.mode==='attention') {
                API.get_attention(this.props.token)
                    .then((json)=>{
                        this.setState({
                            chunks: {
                                title: 'Attention List',
                                data: json.data,
                            },
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
                error_msg: null,
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
        const should_deletion_detect=localStorage['DELETION_DETECT']==='on';
        return (
            <div className="flow-container">
                <FlowChunk
                    title={this.state.chunks.title} list={this.state.chunks.data} mode={this.state.mode}
                    search_param={this.state.search_param||null}
                    show_sidebar={this.props.show_sidebar} deletion_detect={should_deletion_detect}
                />
                {this.state.loading_status==='failed' &&
                    <div className="box box-tip aux-margin">
                        <p><a onClick={()=>{this.load_page(this.state.loaded_pages+1)}}>重新加载</a></p>
                        <p>{this.state.error_msg}</p>
                    </div>
                }
                <TitleLine text={
                    this.state.loading_status==='loading' ?
                        <span><span className="icon icon-loading" />&nbsp;Loading...</span> :
                        '© xmcp'
                } />
            </div>
        );
    }
}