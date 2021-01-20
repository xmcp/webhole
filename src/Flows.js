import React, {Component, PureComponent, useContext, useState, useMemo, useEffect} from 'react';
import {CSSTransition, SwitchTransition} from 'react-transition-group';
import {ColorPicker} from './color_picker';
import {split_text, build_hl_rules, clean_pid} from './text_splitter';
import {format_time, Time, TitleLine, HighlightedText, ClickHandler, ColoredSpan} from './Common';
import './Flows.css';
import LazyLoad from './react-lazyload/src';
import {TokenCtx, PostForm} from './UserAction';
import {BifrostBar, should_show_bifrost_bar} from './Bifrost';
import copy from 'copy-to-clipboard';

import {API} from './flows_api';

const CLICKABLE_TAGS={a: true, audio: true}; // will not trigger sidebar
const PREVIEW_REPLY_COUNT=10;
const QUOTE_BLACKLIST=['23333','233333','66666','666666','10086','10000','100000','99999','999999','55555','555555'];
const IMG_URL_RE=/^.*_(\d+)x(\d+)\.[a-zA-Z0-9]+$/;

window.LATEST_POST_ID=parseInt(localStorage['WEBHOLE_LATEST_POST_ID'],10)||0;

const DZ_NAME='洞主';

export function load_single_meta(show_sidebar,token) {
    return (pid,replace=false)=>{
        pid=parseInt(pid);
        let color_picker=new ColorPicker();
        let title_elem='树洞 '+pid;
        show_sidebar(
            title_elem,
            <div className="box box-tip">
                正在加载 #{pid}
            </div>,
            replace?'replace':'push'
        );
        API.load_replies(pid,token,color_picker)
            .then((json)=>{
                show_sidebar(
                    title_elem,
                    <FlowSidebar key={+new Date()}
                        info={json.post_data} replies={json.data}
                        token={token} show_sidebar={show_sidebar} color_picker={color_picker}
                    />,
                    'replace'
                )
            })
            .catch((e)=>{
                console.error(e);
                show_sidebar(
                    title_elem,
                    <div className="box box-tip">
                        <p><a onClick={()=>load_single_meta(show_sidebar,token)(pid,true)}>重新加载</a></p>
                        <p>{''+e}</p>
                    </div>,
                    'replace'
                );
            })
    };
}

function search_hit(txt,terms) {
    return terms.filter((t)=>t).some((term)=>txt.indexOf(term)!==-1);
}

function Reply(props) {
    let parts=useMemo(()=>(
            [['reply_nameplate',props.info.name]].concat(props.parts||split_text(props.info.text,build_hl_rules(null,props.info.bridge)))
    ), [props.parts,props.info.name,props.info.text]);

    let is_hidden=(props.info.hidden && !props.info.variant.show_hidden);

    return (
        <div className={'flow-reply box'} style={props.info._display_color ? {
            '--box-bgcolor-light': props.info._display_color[0],
            '--box-bgcolor-dark': props.info._display_color[1],
        } : null}>
            <div className="box-header">
                {props.header_badges}
                {is_hidden ?
                    <>
                            {props.in_sidebar ?
                                <a className="interactive" onClick={()=>props.set_variant({show_hidden: true})}>
                                    <span className="icon icon-textfile" /> 显示内容
                                </a> :
                                <span className="link-color">
                                    <span className="icon icon-forward" /> {props.info.verdict||'已折叠'}
                                </span>
                            }
                        &nbsp;
                        </> :
                    <>
                        <code className="box-id">[{props.info.sequence}]</code>
                        &nbsp;
                        {props.info.tag!==null &&
                            <span className="box-header-tag">
                                {props.info.tag}
                            </span>
                        }
                    </>
                }
                <Time stamp={props.info.timestamp} className="box-header-text" />
            </div>
            <FlowItemVariantUp info={props.info} in_sidebar={props.in_sidebar} is_reply={true} set_variant={props.set_variant} />
            {!is_hidden &&
                <div className="box-content">
                    <HighlightedText parts={parts} color_picker={props.color_picker} show_pid={props.show_pid} />
                    <FlowItemExtra info={props.info} in_sidebar={props.in_sidebar} is_reply={true} />
                </div>
            }
            <FlowItemVariantDown info={props.info} in_sidebar={props.in_sidebar} is_reply={true} set_variant={props.set_variant} />
        </div>
    );
}

function gen_placeholder_img(w,h) {
    /*
    let cvs=document.createElement('canvas');
    cvs.width=w;
    cvs.height=h;
    return cvs.toDataURL('png');
    */
    let svg=`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"></svg>`;
    return 'data:image/svg+xml;base64,'+btoa(svg);
}

function SizedImg(props) {
    let [loaded,set_loaded]=useState(false);

    let res=IMG_URL_RE.exec(props.src);

    if(!res)
        return (<img {...props} />);
    else
        return (
            <>
                <img {...props} className={loaded ? '' : 'img-real'} onLoad={()=>set_loaded(true)} />
                {!loaded && <img src={gen_placeholder_img(parseInt(res[1]),parseInt(res[2]))} className="img-placeholder" />}
            </>
        )
}

function FlowItemExtra(props) {
    if(props.info.type==='text')
        return null;
    else if(props.info.type==='image')
        return (
            <p className="img">
                {props.in_sidebar ?
                    <a className="no-underline" href={props.info.extra} target="_blank"><SizedImg src={props.info.extra} /></a> :
                    <SizedImg src={props.info.extra} />
                }
            </p>
        );
    else if(props.info.type==='html')
        return (
            <div dangerouslySetInnerHTML={{__html: props.info.extra}} />
        );
    else
        return (
            <p><i>(not recognized type {props.info.type})</i></p>
        )
}

function ReportWidget(props) {
    let tctx=useContext(TokenCtx);

    let [fold_reason,set_fold_reason]=useState('');

    function report(report_type) {
        const item_type=(props.is_reply ? 'comment' : 'hole');
        let id=(props.is_reply ? props.info.cid : props.info.pid);

        let report_type_str={fold:'折叠',report:'删除'}[report_type];
        let item_type_str={hole:'树洞', comment:'评论'}[item_type];

        let reason;
        if(report_type==='fold') {
            reason=fold_reason;
            if(!reason)
                return;
            if(!window.confirm(`确认因为 ${reason} 举报折叠 ${item_type_str} #${id} 吗？`))
                return;
        } else if(report_type==='report') {
            reason=window.prompt('要举报删除 '+item_type_str+' #'+id+' 的理由：');
            if(!reason)
                return;
        }
        API.report(item_type,id,report_type,reason,tctx.value)
            .then((json)=>{
                alert(`举报${report_type_str}成功`);
            })
            .catch((e)=>{
                alert('举报失败：'+e);
                console.error(e);
            });
    }

    return (
        <div className="interactive flow-item-toolbar report-toolbar">
            <p>
                <button onClick={()=>report('fold')}>折叠</button>
                <select value={fold_reason} onChange={(e)=>set_fold_reason(e.target.value)}>
                    <option value="">选择理由……</option>
                    <option value="政治相关">#政治相关</option>
                    <option value="性相关">#性相关</option>
                    <option value="引战">#引战</option>
                    <option value="未经证实的传闻">#未经证实的传闻</option>
                    <option value="令人不适">#令人不适</option>
                    <option value="偏离话题">#偏离话题</option>
                </select>
            </p>
            <p>
                <button onClick={()=>report('report')}>删除</button>
                <span className="report-reason">这条{props.is_reply?'回复':'树洞'}违反<a href="https://_BRAND_HAPI_DOMAIN/rules" target="_blank">社区规范</a>，应被禁止</span>
            </p>
        </div>
    )
}

function FlowItemVariantUp(props) {
    const tctx=useContext(TokenCtx);
    let res=[];

    if(props.info.variant.report_widget && props.in_sidebar)
        res.push(<ReportWidget key="report" info={props.info} is_reply={props.is_reply} set_variant={props.set_variant} />);

    if(props.in_sidebar && props.info.variant.show_bifrost)
        res.push(<BifrostBar key="bifrost-bar" is_reply={props.is_reply} info={props.info} set_variant={props.set_variant} />);

    if(tctx.perm.ViewingDeleted && props.info.hidden===2)
        res.push(<p key="deleted-hint" className="flow-variant-warning">（已删除）</p>);

    if(props.info.hidden && props.in_sidebar)
        res.push(<p key="hidden-hint" className="flow-hint">可能含有 <b>{props.info.verdict||'令人不适'}</b> 内容</p>);

    if(res.length)
        return res;
    else
        return null;
}

function FlowItemVariantDown(props) {
    let res=[];

    if(!props.is_reply && props.info.attention && props.info.variant.latest_reply)
        res.push(<p key="latest-reply" className="box-footer">最新回复 <Time stamp={props.info.variant.latest_reply} /></p>);

    if(res.length)
        return res;
    else
        return null;
}

function FlowItem(props) {
    function copy_link(event) {
        event.preventDefault();
        function describe_richtext(x) {
            return x.text+(
                x.type==='text' ? '' :
                x.type==='image' ? ' [图片]' :
                x.type==='audio' ? ' [语音]' : (' ['+x.type+']')
            );
        }
        copy(
            `${event.target.href}${props.info.tag ? ' 【'+props.info.tag+'】' : ''}\n`+
            describe_richtext(props.info)+'\n'+
            `（${format_time(new Date(props.info.timestamp*1000))} ${props.info.likenum}关注 ${props.info.reply}回复）\n`+
            props.replies.map((r)=>(
                (r.tag ? '【'+r.tag+'】' : '')+
                '['+r.name+'] '+describe_richtext(r)
            )).join('\n')
        );
    }

    let parts=useMemo(()=>(
        props.parts||split_text(props.info.text,build_hl_rules(null,props.info.bridge))
    ),[props.parts,props.info.text,props.info.bridge]);

    let is_hidden=(props.info.hidden && !(props.info.variant.show_hidden || props.info.attention));
    let id_prefix=(props.info.bridge ? '$' : '#');

    return (
        <div className={'flow-item'+(props.is_quote ? ' flow-item-quote' : '')}>
            {!!props.is_quote &&
                <div className="quote-tip black-outline">
                    <div><span className="icon icon-quote" /></div>
                    <div><small>提到</small></div>
                </div>
            }
            <div className="box">
                {(!!window.LATEST_POST_ID && props.info.pid>window.LATEST_POST_ID) ?
                    <div className="flow-item-dot flow-item-dot-post" /> :
                    (props.info.variant.new_reply && !is_hidden) ? <div className="flow-item-dot flow-item-dot-comment" /> : null
                }
                <div className="box-header">
                    {props.header_badges}
                    {is_hidden ?
                        <>
                            {props.in_sidebar ?
                                <a className="interactive" onClick={()=>props.set_variant({show_hidden: true})}>
                                    <span className="icon icon-textfile" /> 显示内容
                                </a> :
                                <span className="link-color">
                                    <span className="icon icon-forward" /> {props.info.verdict||'已折叠'}
                                </span>
                            }
                            &nbsp;
                        </> :
                        <>
                            <code className="box-id">
                                <a href={'#'+id_prefix+props.info.pid} onClick={copy_link}>
                                    {id_prefix}
                                    {props.info.pid}
                                </a>
                            </code>
                            &nbsp;
                            {props.info.tag!==null &&
                                <span className="box-header-tag">
                                    {props.info.tag}
                                </span>
                            }
                        </>
                    }
                    <Time stamp={props.info.timestamp} className="box-header-text" />
                </div>
                <FlowItemVariantUp info={props.info} in_sidebar={props.in_sidebar} is_reply={false} set_variant={props.set_variant} />
                {!is_hidden &&
                    <div className="box-content">
                        <HighlightedText parts={parts} color_picker={props.color_picker} show_pid={props.show_pid} />
                        <FlowItemExtra info={props.info} in_sidebar={props.in_sidebar} is_reply={false} />
                    </div>
                }
                <FlowItemVariantDown info={props.info} in_sidebar={props.in_sidebar} is_reply={false} set_variant={props.set_variant} />
            </div>
        </div>
    );
}

class FlowSidebar extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            info: props.info,
            replies: props.replies,
            loading_status: 'done',
            error_msg: null,
            filter_name: null,
            rev: false,
        };
        this.color_picker=props.color_picker;
        this.syncState=props.sync_state||(()=>{});
        this.reply_ref=React.createRef();
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

    load_replies() {
        this.setState({
            loading_status: 'loading',
            error_msg: null,
        });
        API.load_replies(this.state.info.pid,this.props.token,this.color_picker)
            .then((json)=>{
                this.setState({
                    replies: json.data,
                    info: json.post_data,
                    loading_status: 'done',
                    error_msg: null,
                }, ()=>{
                    this.syncState({
                        replies: json.data,
                        info: json.post_data,
                    });
                    if(json.data.length)
                        this.set_variant(null,{latest_reply: Math.max.apply(null,this.state.replies.map((r)=>r.timestamp))});
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
        const next_attention=!this.state.info.attention;
        API.set_attention(this.state.info.pid,next_attention,this.props.token)
            .then((json)=>{
                if(json.data.length)
                    json.data.variant={
                        latest_reply: Math.max.apply(null,json.data.map((r)=>r.timestamp)),
                    };
                else
                    json.data.variant={};

                this.setState({
                    loading_status: 'done',
                    info: json.data,
                });
                this.syncState({
                    info: json.data,
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

    set_filter_name(name) {
        this.setState((prevState)=>({
            filter_name: name===prevState.filter_name ? null : name,
        }));
    }

    toggle_rev() {
        this.setState((prevState)=>({
            rev: !prevState.rev,
        }));
    }

    show_reply_bar(name,event) {
        if(this.reply_ref.current && !event.target.closest('a, .clickable, .interactive')) {
            let text=this.reply_ref.current.get();
            if(/^\s*(?:Re (?:|洞主|(?:[A-Z][a-z]+ )?(?:[A-Z][a-z]+)|You Win(?: \d+)?):)?\s*$/.test(text)) {// text is nearly empty so we can replace it
                let should_text='Re '+name+': ';
                if(should_text===this.reply_ref.current.get())
                    this.reply_ref.current.set('');
                else
                    this.reply_ref.current.set(should_text);
            }
        }
    }

    render_self() {
        if(this.state.loading_status==='loading')
            return (<p className="box box-tip">加载中……</p>);

        let show_pid=load_single_meta(this.props.show_sidebar,this.props.token);

        let replies_to_show=this.state.filter_name ? this.state.replies.filter((r)=>r.name===this.state.filter_name) : this.state.replies.slice();
        if(this.state.rev) replies_to_show.reverse();

        // key for lazyload elem
        let view_mode_key=(this.state.rev ? 'y-' : 'n-')+(this.state.filter_name||'null');

        let replies_cnt={[DZ_NAME]:1};
        replies_to_show.forEach((r)=>{
            if(replies_cnt[r.name]===undefined)
                replies_cnt[r.name]=0;
            replies_cnt[r.name]++;
        });

        // hide main thread when filtered
        let main_thread_elem=(this.state.filter_name && this.state.filter_name!==DZ_NAME) ? null : (
            <ClickHandler callback={(e)=>{this.show_reply_bar('',e);}}>
                <FlowItem info={this.state.info} in_sidebar={true}
                          color_picker={this.color_picker} show_pid={show_pid} replies={this.state.replies}
                          set_variant={(variant)=>{this.set_variant(null,variant);}}
                          header_badges={<>
                              <TokenCtx.Consumer>{(tctx)=>(
                                  should_show_bifrost_bar(tctx.perm) && !this.state.info.variant.show_bifrost && (
                                      <span className="reply-header-badge clickable" onClick={()=>{this.set_variant(null,{show_bifrost: true});}}>
                                          Bifrost
                                      </span>
                                  )
                              )}</TokenCtx.Consumer>
                              {!this.state.info.variant.report_widget ?
                                  <span className="reply-header-badge clickable" onClick={()=>{this.set_variant(null,{report_widget: true})}}>
                                      <span className="icon icon-flag" /><label>举报</label>
                                  </span> :
                                  <span className="reply-header-badge clickable" onClick={()=>{this.set_variant(null,{report_widget: false})}}>
                                      <span className="icon icon-flag" /><label>取消</label>
                                  </span>
                              }
                              {replies_cnt[DZ_NAME]>1 &&
                                  <span className="reply-header-badge clickable" onClick={()=>{this.set_filter_name(DZ_NAME);}}>
                                      <span className="icon icon-locate" /><label>只看</label>
                                  </span>
                              }
                          </>}
                />
            </ClickHandler>
        );

        return (
            <div className="flow-item-row sidebar-flow-item">
                <div className="box box-tip">
                    <a onClick={this.load_replies.bind(this)}>
                        <span className="icon icon-refresh" /><label>刷新</label>
                    </a>
                    {(this.state.replies.length>=1 || this.state.rev) &&
                        <span>
                            &nbsp;&nbsp;
                            <a onClick={this.toggle_rev.bind(this)}>
                                <span className={'icon icon-order-rev'+(this.state.rev ? '-down' : '')} />
                                <label>{this.state.info.reply} 回复</label>
                            </a>
                        </span>
                    }
                    &nbsp;&nbsp;
                    <a onClick={()=>{
                        this.toggle_attention();
                    }}>
                        <span>
                            <span className={'icon icon-star'+(this.state.info.attention ? '-ok' : '')} />
                            <label>{this.state.info.likenum} 关注</label>
                        </span>
                    </a>
                </div>
                {!!this.state.filter_name &&
                    <div className="box box-tip flow-item filter-name-bar">
                        <p>
                            <span style={{float: 'left'}}><a onClick={()=>{this.set_filter_name(null)}}>还原</a></span>
                            <span className="icon icon-locate" />&nbsp;当前只看&nbsp;
                            <ColoredSpan colors={this.color_picker.get(this.state.filter_name)}>{this.state.filter_name}</ColoredSpan>
                        </p>
                    </div>
                }
                {!this.state.rev &&
                    main_thread_elem
                }
                {!!this.state.error_msg &&
                    <div className="box box-tip flow-item">
                        <p>回复加载失败</p>
                        <p>{this.state.error_msg}</p>
                    </div>
                }
                {(this.state.info.hidden!==1 || (this.state.info.variant.show_hidden || this.state.info.attention)) ? /* do not show replies if hidden */
                    replies_to_show.map((reply)=>(
                        <LazyLoad key={reply.cid+view_mode_key} offset={1500} height="5em" overflow={true} once={true}>
                            <ClickHandler callback={(e)=>{this.show_reply_bar(reply.name,e);}}>
                                <Reply
                                    info={reply} color_picker={this.color_picker} show_pid={show_pid} in_sidebar={true}
                                    set_variant={(variant)=>{this.set_variant(reply.cid,variant);}}
                                    do_filter_name={replies_cnt[reply.name]>1 ? this.set_filter_name.bind(this) : null}
                                    header_badges={<>
                                        <TokenCtx.Consumer>{(tctx)=>(
                                            should_show_bifrost_bar(tctx.perm) && !reply.variant.show_bifrost &&  (
                                                <span className="reply-header-badge clickable" onClick={()=>{this.set_variant(reply.cid,{show_bifrost: true});}}>
                                                    Bifrost
                                                </span>
                                            )
                                        )}</TokenCtx.Consumer>
                                        {!reply.variant.report_widget ?
                                            <span className="reply-header-badge clickable" onClick={()=>{this.set_variant(reply.cid,{report_widget: true})}}>
                                                <span className="icon icon-flag" /><label>举报</label>
                                            </span> :
                                            <span className="reply-header-badge clickable" onClick={()=>{this.set_variant(reply.cid,{report_widget: false})}}>
                                                <span className="icon icon-flag" /><label>取消</label>
                                            </span>
                                        }
                                        {replies_cnt[reply.name]>1 &&
                                            <span className="reply-header-badge clickable" onClick={()=>{this.set_filter_name(reply.name);}}>
                                                <span className="icon icon-locate" /><label>只看</label>
                                            </span>
                                        }
                                    </>}
                                />
                            </ClickHandler>
                        </LazyLoad>
                    )) :
                    <>
                        {replies_to_show.length>0 &&
                            <div className="box box-tip">
                                共有 {replies_to_show.length} 条回复
                            </div>
                        }
                    </>
                }
                {this.state.rev &&
                    main_thread_elem
                }
                <PostForm pid={this.state.info.pid} token={this.props.token}
                           area_ref={this.reply_ref} on_complete={this.load_replies.bind(this)} />
            </div>
        )
    }

    render() {
        return (
            <SwitchTransition mode="out-in">
                <CSSTransition key={this.state.loading_status} timeout={100} classNames="flows-anim" appear={true}>
                    {this.render_self()}
                </CSSTransition>
            </SwitchTransition>
        );
    }
}

class FlowItemRow extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            replies: props.replies||[],
            reply_status: 'done',
            reply_error: null,
            info: Object.assign({},props.info,{variant: {}}),
        };
        this.color_picker=this.props.color_picker||new ColorPicker();
    }

    componentDidMount() {
        if(this.state.info.reply && this.state.replies.length===0) {
            this.load_replies(null,/*update_post=*/false);
        }
    }

    load_replies(callback,update_post=true) {
        this.setState({
            reply_status: 'loading',
            reply_error: null,
        });
        API.load_replies_with_cache(this.state.info.pid,this.props.token,this.color_picker,this.state.info.hot)
            .then((json)=>{
                this.setState((prev)=>({
                    replies: json.data,
                    info: {
                        ...(update_post ? json.post_data : prev.info),
                        variant: {
                            ...(prev.info.variant||{}),
                            ...json.post_data.variant,
                            latest_reply: Math.max.apply(null,json.data.map((r)=>r.timestamp)),
                        }
                    },
                    reply_status: 'done',
                    reply_error: null,
                }),callback);
            })
            .catch((e)=>{
                console.error(e);
                this.setState({
                    replies: [],
                    reply_status: 'failed',
                    reply_error: ''+e,
                },callback);
            });
    }

    show_sidebar() {
        this.props.show_sidebar(
            '树洞 '+this.state.info.pid,
            <FlowSidebar key={+new Date()}
                info={this.state.info} replies={this.state.replies} sync_state={this.setState.bind(this)}
                token={this.props.token} show_sidebar={this.props.show_sidebar} color_picker={this.color_picker}
            />
        );
    }

    render() {
        let show_pid=load_single_meta(this.props.show_sidebar,this.props.token,[this.state.info.pid]);

        let hl_rules=build_hl_rules(this.props.search_param,this.state.info.bridge);
        let parts=split_text(this.state.info.text,hl_rules);

        let quote_id=null;
        if(!this.props.is_quote)
            for(let [mode,content] of parts)
                if(mode==='pid_bare' || mode==='pid_prefixed') {
                    let quote_pid=''+clean_pid(content);
                    if(QUOTE_BLACKLIST.indexOf(quote_pid)===-1 && parseInt(quote_pid)<parseInt(this.state.info.pid)) {
                        if(quote_id===null)
                            quote_id=parseInt(quote_pid);
                        else {
                            quote_id=null;
                            break;
                        }
                    }
                }

        let showing_replies;
        if(this.props.search_param && this.props.search_param!==(''+this.state.info.pid)) { // filter replies based on search param
            let search_terms=this.props.search_param.split(' ');
            let shown_results=0;
            showing_replies=this.state.replies.map((reply)=>{
                if(shown_results>=PREVIEW_REPLY_COUNT)
                    return null;
                if(reply.hidden) // don't show folded replies as hit
                    return null;
                if(search_hit(reply.text, search_terms)) {
                    shown_results++;
                    let parts=split_text(reply.text,hl_rules);
                    return (
                        <Reply
                            key={reply.cid} parts={parts} info={reply} color_picker={this.color_picker} show_pid={show_pid}
                            header_badges={null} in_sidebar={false} set_variant={(v) => {
                        }}
                        />
                    );
                } else
                    return null;
            }).filter((x)=>x!==null);
        } else // show all replies
            showing_replies=this.state.replies.slice(0,PREVIEW_REPLY_COUNT).map((reply)=>(
                <Reply
                    key={reply.cid} info={reply} color_picker={this.color_picker} show_pid={show_pid}
                    header_badges={null} in_sidebar={false} set_variant={(v)=>{}}
                />
            ));

        let res=(
            <div className={'flow-item-row flow-item-row-with-prompt'+(this.props.is_quote ? ' flow-item-row-quote' : '')} onClick={(e)=>{
                if(!CLICKABLE_TAGS[e.target.tagName.toLowerCase()])
                    this.show_sidebar();
            }}>
                <FlowItem
                    parts={parts} info={this.state.info} in_sidebar={false} is_quote={this.props.is_quote}
                    color_picker={this.color_picker} show_pid={show_pid} replies={this.state.replies} set_variant={(v)=>{}}
                    header_badges={<>
                        {!!this.state.info.likenum &&
                            <span className="box-header-badge">
                                {this.state.info.likenum}&nbsp;
                                <span className={'icon icon-'+(this.state.info.attention ? 'star-ok' : 'star')} />
                            </span>
                        }
                        {!!this.state.info.reply &&
                            <span className="box-header-badge">
                                {this.state.info.reply}&nbsp;
                                <span className="icon icon-reply" />
                            </span>
                        }
                    </>}
                />
                {(this.state.info.hidden!==1 || this.state.info.variant.show_hidden || this.state.info.attention) && /* do not show replies if hidden */
                    <div className="flow-reply-row">
                        {this.state.reply_status==='loading' && <div className="box box-tip">加载中</div>}
                        {this.state.reply_status==='failed' &&
                            <div className="box box-tip">
                                <p><a onClick={()=>{this.load_replies()}}>重新加载回复</a></p>
                                <p>{this.state.reply_error}</p>
                            </div>
                        }
                        {showing_replies}
                        {this.state.replies.length>showing_replies.length &&
                            <div className="box box-tip">还有 {this.state.replies.length-showing_replies.length} 条</div>
                        }
                    </div>
                }
            </div>
        );

        return (quote_id && (this.state.info.hidden!==1 || this.state.info.variant.show_hidden)) ? ( // show quote if not hidden
            <div>
                {res}
                <FlowItemQuote pid={quote_id} show_sidebar={this.props.show_sidebar} token={this.props.token} />
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
        this.color_picker=new ColorPicker();
    }

    componentDidMount() {
        this.load();
    }

    load() {
        this.setState({
            loading_status: 'loading',
        },()=>{
            API.load_replies(this.props.pid,this.props.token,this.color_picker)
                .then((json)=>{
                    this.setState({
                        loading_status: 'done',
                        info: json,
                    });
                })
                .catch((err)=>{
                    if((''+err).indexOf('找不到该树洞')!==-1)
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
                <div className="aux-margin">
                    <div className="box box-tip">
                        <span className="icon icon-loading" />
                        提到了 #{this.props.pid}
                    </div>
                </div>
            );
        else if(this.state.loading_status==='error')
            return (
                <div className="aux-margin">
                    <div className="box box-tip">
                        <p><a onClick={this.load.bind(this)}>重新加载</a></p>
                        <p>{this.state.error_msg}</p>
                    </div>
                </div>
            );
        else // 'done'
            return (
                <FlowItemRow info={this.state.info.post_data} replies={this.state.info.data} color_picker={this.color_picker}
                    show_sidebar={this.props.show_sidebar} token={this.props.token} is_quote={true} />
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
                            <FlowItemRow info={info} show_sidebar={props.show_sidebar} token={token}
                                    search_param={props.search_param} color_picker={null} />
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
            loaded_endchunk: 0,
            chunks: {
                title: '',
                data: [],
            },
            loading_status: 'done',
            error_msg: null,
        };
        this.on_scroll_bound=this.on_scroll.bind(this);
        window.LATEST_POST_ID=parseInt(localStorage['WEBHOLE_LATEST_POST_ID'],10)||0;
    }

    load_page() {
        const failed=(err)=>{
            console.error(err);
            this.setState({
                loading_status: 'failed',
                error_msg: ''+err,
            });
        };

        if(this.state.loading_status!=='done' && this.state.loading_status!=='failed') return;

        let after=this.state.loaded_endchunk;
        if(after===null) return;

        this.setState({
            loading_status: 'loading',
            error_msg: null,
        });

        console.log('fetching after',after);

        if(this.state.mode==='list') {
            API.get_list(after,this.props.token)
                .then((json)=>{
                    if(after===0 && json.data.length) { // update latest_post_id
                        let max_id=-1;
                        json.data.forEach((x)=>{
                            if(x.pid>max_id)
                                max_id=x.pid;
                        });
                        localStorage['WEBHOLE_LATEST_POST_ID']=''+max_id;
                    }
                    this.setState((prev)=>({
                        chunks: {
                            title: '最新',
                            data: prev.chunks.data.concat(json.data),
                        },
                        loading_status: 'done',
                        loaded_endchunk: json.endchunk,
                    }));
                })
                .catch(failed);
        } else if(this.state.mode==='search') {
            API.get_search(after,this.state.search_param,this.props.token)
                .then((json)=>{
                    this.setState((prev)=>({
                        chunks: {
                            title: '搜索 "'+this.state.search_param+'"',
                            data: prev.chunks.data.concat(json.data),
                        },
                        loading_status: 'done',
                        loaded_endchunk: json.endchunk,
                    }));
                })
                .catch(failed);
        } else if(this.state.mode==='single') {
            const pid=parseInt(this.state.search_param.substr(1),10);
            let color_picker=new ColorPicker();
            API.load_replies(pid,this.props.token,color_picker)
                .then((json)=>{
                    this.setState({
                        chunks: {
                            title: '树洞 '+pid,
                            data: [json.post_data],
                        },
                        loading_status: 'done',
                        loaded_endchunk: null,
                    });
                })
                .catch(failed);
        } else if(this.state.mode==='attention') {
            API.get_attention(after,this.props.token)
                .then((json)=>{
                    this.setState((prev)=>({
                        chunks: {
                            title: '关注列表',
                            data: prev.chunks.data.concat(json.data),
                        },
                        mode: 'attention',
                        loading_status: 'done',
                        loaded_endchunk: json.endchunk,
                    }));
                })
                .catch(failed);
        } else {
            console.log('nothing to load');
        }
    }

    on_scroll(event) {
        if(event.target===document) {
            const avail=document.body.scrollHeight-window.scrollY-window.innerHeight;
            if(avail<window.innerHeight && this.state.loading_status==='done')
                this.load_page();
        }
    }

    componentDidMount() {
        this.load_page();
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
                <FlowChunk
                    title={this.state.chunks.title} list={this.state.chunks.data} mode={this.state.mode}
                    search_param={this.state.mode==='single' ? null : (this.state.search_param||null)}
                    show_sidebar={this.props.show_sidebar}
                />
                {this.state.loading_status==='failed' &&
                    <div className="aux-margin">
                        <div className="box box-tip">
                            <p><a onClick={()=>this.load_page()}>重新加载</a></p>
                            <p>{this.state.error_msg}</p>
                        </div>
                    </div>
                }
                <TitleLine text={
                    this.state.loading_status==='loading' ?
                        <span><span className="icon icon-loading" />&nbsp;Loading...</span> :
                        '_BRAND_COPYRIGHT'
                } />
            </div>
        );
    }
}