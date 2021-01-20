import React, {Component, PureComponent, useState, useEffect, useContext} from 'react';
import {SafeTextarea, PromotionBar, HAPI_DOMAIN, GATEWAY_DOMAIN, BrowserWarningBar} from './Common';
import {MessageViewer} from './Message';
import {ConfigUI} from './Config';
import copy from 'copy-to-clipboard';
import {cache} from './cache';
import {get_json, token_param} from './flows_api';

import './UserAction.css';

const MAX_IMG_DIAM=8000;
const MAX_IMG_PX=5000000;
const MAX_IMG_FILESIZE=500000;
const MAX_IMG_FILESIZE_LIM=550000; // used for: png detect limit, too big failure limit
const IMG_QUAL_MIN=.1;
const IMG_QUAL_MAX=.9;

export const TokenCtx=React.createContext({
    value: null,
    ring: null,
    logout: ()=>{},
});

const supports_webp=(()=>{
    let cvs=document.createElement('canvas');
    cvs.width=1;
    cvs.height=1;
    let url=cvs.toDataURL('image/webp',1);
    return url.indexOf('webp')!==-1;
})();

function bisect_img_quality(canvas,ql,qr,callback,progress_callback,type=null) {
    // check for png first
    if(type===null) {
        progress_callback('正在编码 png');
        canvas.toBlob((blob)=>{
            console.log('bisect img quality:','png','size',blob.size);
            if(blob.size<MAX_IMG_FILESIZE_LIM)
                callback('png', blob);
            else {
                type=((supports_webp && !window.__WEBHOLE_DISABLE_WEBP)?'webp':'jpeg');
                bisect_img_quality(canvas,ql,qr,callback,progress_callback,type);
            }
        },'image/png');
        return;
    }

    let q=(qr+ql)/2;
    if(qr-ql<.06) { // done
        progress_callback('正在编码 '+type+'@'+(q*100).toFixed(0));
        canvas.toBlob((blob)=>{
            console.log('bisect img quality:',type,'quality',q,'size',blob.size);
            if(ql<=.101 && blob.size>MAX_IMG_FILESIZE_LIM)
                callback('图片过大', null);
            else
                callback(`${type}@${(q*100).toFixed(0)}`, blob);
        },'image/'+type,q);
    } else { // bisect quality
        progress_callback('正在编码 jpeg@'+(q*100).toFixed(0));
        canvas.toBlob((blob)=>{
            console.log('bisect img quality:',type,'range',ql,qr,'quality',q,'size',blob.size);
            if(blob.size>MAX_IMG_FILESIZE)
                bisect_img_quality(canvas,ql,q,callback,progress_callback,type);
            else
                bisect_img_quality(canvas,q,qr,callback,progress_callback,type);
        },'image/jpeg',q);
    }
}

function InviteViewer(props) {
    let [res,set_res]=useState(null);

    useEffect(()=>{
        fetch(HAPI_DOMAIN+'/api/users/invites?role=invite'+token_param(props.token))
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                set_res(json);
            })
            .catch((e)=>{
                alert('加载失败。'+e);
            });
    },[]);

    if(res===null)
        return (
            <div className="box box-tip">
                <span className="icon icon-loading" /> 正在获取……
            </div>
        );

    function copy_code() {
        if(copy(res.code))
            alert('已复制');
    }

    return (
        <div className="box box-tip">
            <p>使用下面的邀请码来邀请朋友注册：</p>
            <p className="invite-code">
                <code>{res.code||'（无）'}</code> <a onClick={copy_code}>（复制）</a></p>
            <p>还可以邀请 {res.remaining||0} 人</p>
        </div>
    )
}

export function InfoSidebar(props) {
    let tctx=useContext(TokenCtx);

    return (
        <div>
            <BrowserWarningBar />
            <PromotionBar />
            <LoginForm show_sidebar={props.show_sidebar} />
            <div className="box list-menu">
                <a onClick={()=>{props.show_sidebar(
                    '设置',
                    <ConfigUI />
                )}}>
                    <span className="icon icon-settings" /><label>树洞设置</label>
                </a>
                &nbsp;&nbsp;
                <a href="https://_BRAND_HAPI_DOMAIN/rules" target="_blank">
                    <span className="icon icon-textfile" /><label>社区规范</label>
                </a>
                &nbsp;&nbsp;
                <a href="https://_BRAND_FEEDBACK_URL" target="_blank">
                    <span className="icon icon-fire" /><label>意见反馈</label>
                </a>
            </div>
            <div className="box help-desc-box">
                <p>
                    本项目基于&nbsp;
                    <a href="https://github.com/xmcp/webhole" target="_blank" rel="noopener">网页版树洞 by @xmcp</a>
                    。感谢&nbsp;
                    <a href="https://reactjs.org/" target="_blank" rel="noopener">React</a>
                    、
                    <a href="https://icomoon.io/#icons" target="_blank" rel="noopener">IcoMoon</a>
                    &nbsp;等开源项目
                </p>
                <p>
                    <a onClick={()=>{
                        if('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations()
                                .then((registrations)=>{
                                    for(let registration of registrations) {
                                        console.log('unregister',registration);
                                        registration.unregister();
                                    }
                                });
                        }
                        cache().clear();
                        setTimeout(()=>{
                            window.location.reload(true);
                        },200);
                    }}>强制检查更新</a>
                    （{process.env.REACT_APP_BUILD_INFO||'---'} {tctx.backend_version} {process.env.NODE_ENV}）
                </p>
                <p>
                    This program is free software: you can redistribute it and/or modify
                    it under the terms of the GNU General Public License as published by
                    the Free Software Foundation, either version 3 of the License, or
                    (at your option) any later version.
                </p>
                <p>
                    This program is distributed in the hope that it will be useful,
                    but WITHOUT ANY WARRANTY; without even the implied warranty of
                    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the&nbsp;
                    <a href="https://www.gnu.org/licenses/gpl-3.0.zh-cn.html" target="_blank">GNU General Public License</a>
                    &nbsp;for more details.
                </p>
            </div>
        </div>
    );
}

export class LoginForm extends Component {
    copy_token(token) {
        if(copy(token))
            alert('复制成功！\n请一定不要泄露哦');
    }

    render() {
        return (
            <TokenCtx.Consumer>{(token)=>
                <div className="login-form box">
                    <p>
                        <b>您已登录。</b>
                        <button type="button" onClick={token.logout}>
                            <span className="icon icon-logout" /> 注销
                        </button>
                        <br />
                    </p>
                    <p>
                        <a onClick={()=>{this.props.show_sidebar(
                            '系统消息',
                            <MessageViewer token={token.value} />
                        )}}>查看系统消息</a><br />
                        当您发送的内容违规时，我们将用系统消息提示您
                    </p>
                    <p>
                        <a href="https://_BRAND_GATEWAY_DOMAIN/users/cp" target="_blank">
                            账号管理
                        </a><br />
                        可以修改您的登录密码
                    </p>
                    {/*<p>
                        <a onClick={this.copy_token.bind(this,token.value)}>复制 User Token</a><br />
                        User Token 用于迁移登录状态，切勿告知他人。
                    </p>*/}
                    {!!token.remember_token &&
                        <p>
                            <a href={HAPI_DOMAIN+'/pillory?rr_token='+token.remember_token} target="_blank">违规处理公示</a><br />
                            _BRAND_COMMUNITY_SLOGAN，对于内容违反 <a href="https://_BRAND_HAPI_DOMAIN/rules" target="_blank">社区规范</a>
                            &nbsp;的删帖和封禁情况将在此进行公示
                        </p>
                    }
                </div>
            }</TokenCtx.Consumer>
        )
    }
}

export class PostForm extends Component {
    constructor(props) {
        super(props);
        this.state={
            bridge: false,
            text: '',
            type: 'text',
            loading_status: 'done',
            img_extra: null, // {tip, img}
        };
        this.img_ref=React.createRef();
        this.area_ref=this.props.area_ref||React.createRef();
        this.on_change_bound=this.on_change.bind(this);
        this.on_img_change_bound=this.on_img_change.bind(this);
        this.global_keypress_handler_bound=this.global_keypress_handler.bind(this);
    }

    global_keypress_handler(e) {
        if(e.code==='Enter' && !e.ctrlKey && !e.altKey && ['input','textarea'].indexOf(e.target.tagName.toLowerCase())===-1) {
            if(this.area_ref.current) {
                e.preventDefault();
                this.area_ref.current.focus();
            }
        }
    }
    componentDidMount() {
        if(this.area_ref.current && !this.props.pid) // new post
            this.area_ref.current.focus();
        document.addEventListener('keypress',this.global_keypress_handler_bound);
    }
    componentWillUnmount() {
        document.removeEventListener('keypress',this.global_keypress_handler_bound);
    }

    on_change(value) {
        this.setState({
            text: value,
        });
    }

    do_post(text,type,extra_data) {
        let url=this.props.pid ?
            ('/api/holes/reply/'+this.props.pid+'?role=reply'): // reply
            '/api/holes/post?role=post'; // post new
        let body=new FormData();
        body.append('text',this.state.text);
        body.append('bridge',this.state.bridge);
        body.append('type',type);
        if(extra_data) {
            let type=extra_data.blob.type;
            if(type.indexOf('image/')!==0) {
                alert('上传图片类型错误');
                this.setState({
                    loading_status: 'done',
                });
                return;
            }
            body.append('data_type',extra_data.quality_str);
            body.append('data',extra_data.blob);
        }
        fetch(HAPI_DOMAIN+url+token_param(this.props.token), {
            method: 'POST',
            body: body,
        })
            .then(get_json)
            .then((json)=>{
                if(json.error) {
                    throw new Error(json.error_msg||json.error);
                }

                this.setState({
                    loading_status: 'done',
                    type: 'text',
                    text: '',
                });
                if(this.area_ref.current) // sidebar may be closed when posting
                    this.area_ref.current.clear();
                this.props.on_complete();
            })
            .catch((e)=>{
                alert('发送失败。'+e);
                this.setState({
                    loading_status: 'done',
                });
            });
    }

    proc_img(file) {
        let that=this;
        return new Promise((resolve,reject)=>{
            let reader=new FileReader();
            function on_got_img(url) {
                const image = new Image();
                image.onload=(()=>{
                    let width=image.width;
                    let height=image.height;
                    let compressed=false;

                    if(width>MAX_IMG_DIAM) {
                        height=height*MAX_IMG_DIAM/width;
                        width=MAX_IMG_DIAM;
                        compressed=true;
                    }
                    if(height>MAX_IMG_DIAM) {
                        width=width*MAX_IMG_DIAM/height;
                        height=MAX_IMG_DIAM;
                        compressed=true;
                    }
                    if(height*width>MAX_IMG_PX) {
                        let rate=Math.sqrt(height*width/MAX_IMG_PX);
                        height/=rate;
                        width/=rate;
                        compressed=true;
                    }
                    console.log('chosen img size',width,height);

                    let canvas=document.createElement('canvas');
                    let ctx=canvas.getContext('2d', {
                        alpha: false,
                    });
                    canvas.width=width;
                    canvas.height=height;
                    ctx.drawImage(image,0,0,width,height);

                    bisect_img_quality(canvas,IMG_QUAL_MIN,IMG_QUAL_MAX, (quality_str, blob)=>{
                            if(blob===null) {
                                reject('无法上传：'+quality_str);
                                return;
                            }

                            resolve({
                                blob: blob,
                                quality_str: quality_str,
                                width: Math.round(width),
                                height: Math.round(height),
                                compressed: compressed,
                            });
                    }, (progress)=>{
                        that.setState({
                            img_extra: {
                                tip: '（'+progress+'……）',
                                img: null,
                            }
                        });
                    });
                });
                image.src=url;
            }
            reader.onload=(event)=>{
                on_got_img(event.target.result);
                //fixOrientation(event.target.result,{},(fixed_dataurl)=>{
                //    on_got_img(fixed_dataurl);
                //});
            };
            reader.readAsDataURL(file);
        });
    }

    on_img_change() {
        if(this.img_ref.current && this.img_ref.current.files.length)
            this.setState({
                img_extra: {
                    tip: '（正在处理图片……）',
                    img: null,
                }
            },()=>{
                this.proc_img(this.img_ref.current.files[0])
                    .then((d)=>{
                        this.setState({
                            img_extra: {
                                tip: `（${d.compressed?'压缩到':'尺寸'} ${d.width}*${d.height} / `+
                                    `${Math.floor(d.blob.size/1000)}KB ${d.quality_str}）`,
                                img: {
                                    blob: d.blob,
                                    quality_str: d.quality_str,
                                    width: d.width,
                                    height: d.height,
                                },
                            },
                        });
                    })
                    .catch((e)=>{
                        this.setState({
                            img_extra: {
                                tip: `图片无效：${e}`,
                                img: null,
                            },
                        });
                    });
            });
        else
            this.setState({
                img_extra: {
                    tip: null,
                    img: null,
                },
            });
    }

    on_submit(event) {
        if(event) event.preventDefault();
        if(this.state.loading_status==='loading')
            return;

        if(this.state.type==='text') {
            this.setState({
                loading_status: 'loading',
            });
            this.do_post(this.state.text,'text',null);
        }
        else if(this.state.type==='image') {
            if(!this.state.img_extra.img) {
                alert('请选择图片');
                return;
            }

            this.setState({
                loading_status: 'loading',
            });
            this.do_post(this.state.text,this.state.type,this.state.img_extra.img);
        }
    }

    render() {
        let is_reply=(this.props.pid!==null);
        let area_id=is_reply ? this.props.pid : 'new_post';
        return (
            <>
                {!is_reply &&
                    <TokenCtx.Consumer>{(tctx)=>(
                        <div className="box">
                            <p>
                                发帖前请阅读并同意
                                <a href="https://_BRAND_HAPI_DOMAIN/rules" target="_blank">_BRAND_NAME社区规范</a>
                                。
                            </p>
                        </div>
                    )}</TokenCtx.Consumer>
                }
                <form onSubmit={this.on_submit.bind(this)} className={is_reply ? ('post-form post-form-reply box'+(this.state.text?' reply-sticky':'')) : 'post-form box'}>
                    <div className="post-form-bar">
                        <span className="post-form-switcher">
                            {is_reply ? '回复' : '发表'} &nbsp;
                            <span className={'post-form-switch'+(this.state.type==='text'?' post-form-switch-cur':'')} onClick={()=>this.setState({type: 'text'})}>
                                <span className="icon icon-pen" /> 文字
                            </span>
                            <span className={'post-form-switch'+(this.state.type==='image'?' post-form-switch-cur':'')} onClick={()=>this.setState({type: 'image', img_extra: {tip: null, blob: null}})}>
                                <span className="icon icon-image" /> 图片
                            </span>
                        </span>
                        {this.state.loading_status!=='done' ?
                            <button className="post-btn" disabled="disabled">
                                <span className="icon icon-loading" />
                                &nbsp;正在{this.state.loading_status==='processing' ? '处理' : '上传'}
                            </button> :
                            <button className="post-btn" type="submit">
                                <span className="icon icon-send" />
                                &nbsp;发送
                            </button>
                        }
                    </div>
                    <SafeTextarea key={area_id} ref={this.area_ref} id={area_id} on_change={this.on_change_bound} on_submit={()=>this.on_submit()} />
                    {this.state.type==='image' && !!this.state.img_extra &&
                        <p className="post-form-img-tip">
                            <input ref={this.img_ref} type="file" accept="image/*" disabled={this.state.loading_status!=='done'}
                                   onChange={this.on_img_change_bound} style={{position: 'fixed', top: '-200%', visibility: 'hidden'}}
                            />
                            {this.state.img_extra.tip ?
                                <>
                                    {!!this.state.img_extra.img &&
                                        <a onClick={()=>{this.img_ref.current.value=""; this.on_img_change();}}>删除图片</a>
                                    }
                                    {this.state.img_extra.tip}
                                </> :
                                <a onClick={()=>this.img_ref.current.click()}>选择要上传的图片</a>
                            }
                        </p>
                    }
                </form>
            </>
        )
    }
}