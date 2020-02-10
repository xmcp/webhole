import React, {Component, PureComponent} from 'react';
import {API_BASE, SafeTextarea, PromotionBar} from './Common';
import {MessageViewer} from './Message';
import {LoginPopup} from './infrastructure/widgets';
import {ConfigUI} from './Config';
import fixOrientation from 'fix-orientation';
import copy from 'copy-to-clipboard';
import {cache} from './cache';
import {API_VERSION_PARAM, PKUHELPER_ROOT, API, get_json, token_param} from './flows_api';

import './UserAction.css';

const BASE64_RATE=4/3;
const MAX_IMG_DIAM=8000;
const MAX_IMG_PX=5000000;
const MAX_IMG_FILESIZE=450000*BASE64_RATE;

export const TokenCtx=React.createContext({
    value: null,
    set_value: ()=>{},
});

class LifeInfoBox extends Component {
    constructor(props) {
        super(props);
        if(!window._life_info_cache)
            window._life_info_cache={};
        this.CACHE_TIMEOUT_S=15;
        this.state={
            today_info: this.cache_get('today_info'),
            card_balance: this.cache_get('card_balance'),
            net_balance: this.cache_get('net_balance'),
            mail_count: this.cache_get('mail_count'),
        };
        this.INTERNAL_NETWORK_FAILURE='_network_failure';
        this.API_NAME={
            today_info: 'hole/today_info',
            card_balance: 'isop/card_balance',
            net_balance: 'isop/net_balance',
            mail_count: 'isop/mail_count',
        };
    }

    cache_get(key) {
        let cache_item=window._life_info_cache[key];
        if(!cache_item || (+new Date())-cache_item[0]>1000*this.CACHE_TIMEOUT_S)
            return null;
        else
            return cache_item[1];
    }
    cache_set(key,value) {
        if(!window._life_info_cache[key] || window._life_info_cache[key][1]!==value)
            window._life_info_cache[key]=[+new Date(),value];
    }

    load(state_key) {
        this.setState({
            [state_key]: null,
        },()=>{
            fetch(
                PKUHELPER_ROOT+'api_xmcp/'+this.API_NAME[state_key]
                +'?user_token='+encodeURIComponent(this.props.token)
                +API_VERSION_PARAM()
            )
                .then(get_json)
                .then((json)=>{
                    //console.log(json);
                    this.setState({
                        [state_key]: json,
                    });
                })
                .catch((e)=>{
                    this.setState({
                        [state_key]: {
                            errMsg: '网络错误 '+e,
                            errCode: this.INTERNAL_NETWORK_FAILURE,
                            success: false,
                        }
                    });
                })
        });
    }

    componentDidMount() {
        ['today_info','card_balance','net_balance','mail_count'].forEach((k)=>{
            if(!this.state[k])
                this.load(k);
        });
    }

    reload_all() {
        ['today_info','card_balance','net_balance','mail_count'].forEach((k)=>{
            this.load(k);
        });
    }

    render_line(state_key,title,value_fn,action,url_fn,do_login) {
        let s=this.state[state_key];
        if(!s)
            return (
                <tr>
                    <td>{title}</td>
                    <td>加载中……</td>
                    <td />
                </tr>
            );
        else if(!s.success) {
            let type='加载失败';
            if(s.errCode===this.INTERNAL_NETWORK_FAILURE)
                type='网络错误';
            else if(['E01','E02','E03'].indexOf(s.errCode)!==-1)
                type='授权失效';

            let details=JSON.stringify(s);
            if(s.errMsg)
                details=s.errMsg;
            else if(s.error)
                details=s.error;

            return (
                <tr>
                    <td>{title}</td>
                    <td className="life-info-error">
                        <a onClick={()=>alert(details)}>{type}</a>
                    </td>
                    <td>
                        {type==='授权失效' ?
                            <a onClick={do_login}>
                                <span className="icon icon-forward" />&nbsp;重新登录
                            </a> :
                            <a onClick={()=>this.load(state_key)}>
                                <span className="icon icon-forward" />&nbsp;重试
                            </a>
                        }
                    </td>
                </tr>
            )
        }
        else {
            this.cache_set(state_key,s);

            return (
                <tr>
                    <td>{title}</td>
                    <td>{value_fn(s)}</td>
                    <td>
                        <a href={url_fn(s)} target="_blank">
                            <span className="icon icon-forward" />&nbsp;{action}
                        </a>
                    </td>
                </tr>
            );
        }
    }

    render() {
        return (
            <LoginPopup token_callback={(t)=>{
                this.props.set_token(t);
                this.reload_all();
            }}>{(do_login)=>(
                <div className="box">
                    <table className="life-info-table">
                        <tbody>
                            {this.render_line(
                                'today_info',
                                '今日',(s)=>s.info,
                                '校历',(s)=>s.schedule_url,
                                do_login,
                            )}
                            {this.render_line(
                                'card_balance',
                                '校园卡',(s)=>`余额￥${s.balance.toFixed(2)}`,
                                '充值',()=>'https://virtualprod.alipay.com/educate/educatePcRecharge.htm?schoolCode=PKU&schoolName=',
                                do_login,
                            )}
                            {this.render_line(
                                'net_balance',
                                '网费',(s)=>`余额￥${s.balance.toFixed(2)}`,
                                '充值',()=>'https://its.pku.edu.cn/epay.jsp',
                                do_login,
                            )}
                            {this.render_line(
                                'mail_count',
                                '邮件',(s)=>`未读 ${s.count} 封`,
                                '查看',()=>'https://mail.pku.edu.cn/',
                                do_login,
                            )}
                        </tbody>
                    </table>
                </div>
            )}</LoginPopup>
        )
    }
}

export function InfoSidebar(props) {
    return (
        <div>
            <PromotionBar />
            <LoginForm show_sidebar={props.show_sidebar} />
            <div className="box list-menu">
                <a onClick={()=>{props.show_sidebar(
                    '设置',
                    <ConfigUI />
                )}}>
                    <span className="icon icon-settings" /><label>网页版树洞设置</label>
                </a>
                &nbsp;&nbsp;
                <a href="http://pkuhelper.pku.edu.cn/treehole_rules.html" target="_blank">
                    <span className="icon icon-textfile" /><label>树洞规范</label>
                </a>
                &nbsp;&nbsp;
                <a href="https://github.com/pkuhelper-web/webhole/issues" target="_blank">
                    <span className="icon icon-github" /><label>意见反馈</label>
                </a>
            </div>
            <div className="box help-desc-box">
                <p>
                    PKUHelper 网页版树洞 by @xmcp，
                    基于&nbsp;
                    <a href="https://www.gnu.org/licenses/gpl-3.0.zh-cn.html" target="_blank">GPLv3</a>
                    &nbsp;协议在 <a href="https://github.com/pkuhelper-web/webhole" target="_blank">GitHub</a> 开源
                </p>
                <p>
                    PKUHelper 网页版的诞生离不开&nbsp;
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
                    （{process.env.REACT_APP_BUILD_INFO||'---'} {process.env.NODE_ENV} 会自动在后台检查更新并在下次访问时更新）
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

class ResetUsertokenWidget extends Component {
    constructor(props) {
        super(props);
        this.state={
            loading_status: 'done',
        };
    }

    do_reset() {
        if(window.confirm('您正在重置 UserToken！\n您的账号将会在【所有设备】上注销，您需要手动重新登录！')) {
            let uid=window.prompt('您正在重置 UserToken！\n请输入您的学号以确认身份：');
            if(uid)
                this.setState({
                    loading_status: 'loading',
                },()=>{
                    fetch(PKUHELPER_ROOT+'api_xmcp/hole/reset_usertoken', {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_token: this.props.token,
                            uid: uid,
                        }),
                    })
                        .then(get_json)
                        .then((json)=>{
                            if(json.error)
                                throw new Error(json.error);
                            else
                                alert('重置成功！您需要在所有设备上重新登录。');

                            this.setState({
                                loading_status: 'done',
                            });
                        })
                        .catch((e)=>{
                            alert('重置失败：'+e);
                            this.setState({
                                loading_status: 'done',
                            });
                        })
                });
        }
    }

    render() {
        if(this.state.loading_status==='done')
            return (<a onClick={this.do_reset.bind(this)}>重置</a>);
        else if(this.state.loading_status==='loading')
            return (<a><span className="icon icon-loading" /></a>);
    }
}

export class LoginForm extends Component {
    copy_token(token) {
        if(copy(token))
            alert('复制成功！\n请一定不要泄露哦');
    }

    render() {
        return (
            <TokenCtx.Consumer>{(token)=>
                <div>
                    {!!token.value &&
                        <LifeInfoBox token={token.value} set_token={token.set_value} />
                    }
                    <div className="login-form box">
                        {token.value ?
                            <div>
                                <p>
                                    <b>您已登录。</b>
                                    <button type="button" onClick={()=>{token.set_value(null);}}>
                                        <span className="icon icon-logout" /> 注销
                                    </button>
                                    <br />
                                </p>
                                <p>
                                    根据计算中心要求，访问授权三个月内有效，过期需重新登录。
                                </p>
                                <p>
                                    <a onClick={()=>{this.props.show_sidebar(
                                        '系统消息',
                                        <MessageViewer token={token.value} />
                                    )}}>查看系统消息</a><br />
                                    当您发送的内容违规时，我们将用系统消息提示您
                                </p>
                                <p>
                                    <a onClick={this.copy_token.bind(this,token.value)}>复制 User Token</a><br />
                                    User Token 用于迁移登录状态，切勿告知他人，若怀疑被盗号请尽快 <ResetUsertokenWidget token={token.value} />
                                </p>
                            </div> :
                            <LoginPopup token_callback={token.set_value}>{(do_popup)=>(
                                <div>
                                    <p>
                                        <button type="button" onClick={do_popup}>
                                            <span className="icon icon-login" />
                                            &nbsp;登录
                                        </button>
                                    </p>
                                    <p><small>
                                        PKU Helper 面向北京大学学生，通过 ISOP（北京大学数据共享开放服务平台）验证您的身份并提供服务。
                                    </small></p>
                                </div>
                            )}</LoginPopup>
                        }
                    </div>
                </div>
            }</TokenCtx.Consumer>
        )
    }
}

export class ReplyForm extends Component {
    constructor(props) {
        super(props);
        this.state={
            text: '',
            loading_status: 'done',
        };
        this.on_change_bound=this.on_change.bind(this);
        this.area_ref=this.props.area_ref||React.createRef();
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

    on_submit(event) {
        if(event) event.preventDefault();
        if(this.state.loading_status==='loading')
            return;
        this.setState({
            loading_status: 'loading',
        });

        let data=new URLSearchParams();
        data.append('pid',this.props.pid);
        data.append('text',this.state.text);
        data.append('user_token',this.props.token);
        fetch(API_BASE+'/api.php?action=docomment'+token_param(this.props.token), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then(get_json)
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(JSON.stringify(json));
                }

                this.setState({
                    loading_status: 'done',
                    text: '',
                });
                this.area_ref.current.clear();
                this.props.on_complete();
            })
            .catch((e)=>{
                console.error(e);
                alert('回复失败');
                this.setState({
                    loading_status: 'done',
                });
            });
    }

    render() {
        return (
            <form onSubmit={this.on_submit.bind(this)} className={'reply-form box'+(this.state.text?' reply-sticky':'')}>
                <SafeTextarea key={this.props.pid} ref={this.area_ref} id={this.props.pid} on_change={this.on_change_bound} on_submit={this.on_submit.bind(this)} />
                {this.state.loading_status==='loading' ?
                    <button disabled="disabled">
                        <span className="icon icon-loading" />
                    </button> :
                    <button type="submit">
                        <span className="icon icon-send" />
                    </button>
                }
            </form>
        )
    }
}

export class PostForm extends Component {
    constructor(props) {
        super(props);
        this.state={
            text: '',
            loading_status: 'done',
            img_tip: null,
        };
        this.img_ref=React.createRef();
        this.area_ref=React.createRef();
        this.on_change_bound=this.on_change.bind(this);
        this.on_img_change_bound=this.on_img_change.bind(this);
    }

    componentDidMount() {
        if(this.area_ref.current)
            this.area_ref.current.focus();
    }

    on_change(value) {
        this.setState({
            text: value,
        });
    }

    do_post(text,img) {
        let data=new URLSearchParams();
        data.append('text',this.state.text);
        data.append('type',img ? 'image' : 'text');
        data.append('user_token',this.props.token);
        if(img)
            data.append('data',img);

        fetch(API_BASE+'/api.php?action=dopost'+token_param(this.props.token), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then(get_json)
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(JSON.stringify(json));
                }

                this.setState({
                    loading_status: 'done',
                    text: '',
                });
                this.area_ref.current.clear();
                this.props.on_complete();
            })
            .catch((e)=>{
                console.error(e);
                alert('发表失败');
                this.setState({
                    loading_status: 'done',
                });
            });
    }

    proc_img(file) {
        return new Promise((resolve,reject)=>{
            function return_url(url) {
                const idx=url.indexOf(';base64,');
                if(idx===-1)
                    throw new Error('img not base64 encoded');

                return url.substr(idx+8);
            }

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
                    let ctx=canvas.getContext('2d');
                    canvas.width=width;
                    canvas.height=height;
                    ctx.drawImage(image,0,0,width,height);

                    let quality_l=.1,quality_r=.9,quality,new_url;
                    while(quality_r-quality_l>=.03) {
                        quality=(quality_r+quality_l)/2;
                        new_url=canvas.toDataURL('image/jpeg',quality);
                        console.log(quality_l,quality_r,'trying quality',quality,'size',new_url.length);
                        if(new_url.length<=MAX_IMG_FILESIZE)
                            quality_l=quality;
                        else
                            quality_r=quality;
                    }
                    if(quality_l>=.101) {
                        console.log('chosen img quality',quality);
                        resolve({
                            img: return_url(new_url),
                            quality: quality,
                            width: Math.round(width),
                            height: Math.round(height),
                            compressed: compressed,
                        });
                    } else {
                        reject('图片过大，无法上传');
                    }
                });
                image.src=url;
            }
            reader.onload=(event)=>{
                fixOrientation(event.target.result,{},(fixed_dataurl)=>{
                    on_got_img(fixed_dataurl);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    on_img_change() {
        if(this.img_ref.current && this.img_ref.current.files.length)
            this.setState({
                img_tip: '（正在处理图片……）'
            },()=>{
                this.proc_img(this.img_ref.current.files[0])
                    .then((d)=>{
                        this.setState({
                            img_tip: `（${d.compressed?'压缩到':'尺寸'} ${d.width}*${d.height} / `+
                                `质量 ${Math.floor(d.quality*100)}% / ${Math.floor(d.img.length/BASE64_RATE/1000)}KB）`,
                        });
                    })
                    .catch((e)=>{
                        this.setState({
                            img_tip: `图片无效：${e}`,
                        });
                    });
            });
        else
            this.setState({
                img_tip: null,
            });
    }

    on_submit(event) {
        if(event) event.preventDefault();
        if(this.state.loading_status==='loading')
            return;
        if(this.img_ref.current.files.length) {
            this.setState({
                loading_status: 'processing',
            });
            this.proc_img(this.img_ref.current.files[0])
                .then((d)=>{
                    this.setState({
                        loading_status: 'loading',
                    });
                    this.do_post(this.state.text,d.img);
                })
                .catch((e)=>{
                    alert(e);
                });
        } else {
            this.setState({
                loading_status: 'loading',
            });
            this.do_post(this.state.text,null);
        }
    }

    render() {
        return (
            <form onSubmit={this.on_submit.bind(this)} className="post-form box">
                <div className="post-form-bar">
                    <label>
                        图片
                        <input ref={this.img_ref} type="file" accept="image/*" disabled={this.state.loading_status!=='done'}
                               onChange={this.on_img_change_bound}
                        />
                    </label>
                    {this.state.loading_status!=='done' ?
                        <button disabled="disabled">
                            <span className="icon icon-loading" />
                            &nbsp;正在{this.state.loading_status==='processing' ? '处理' : '上传'}
                        </button> :
                        <button type="submit">
                            <span className="icon icon-send" />
                            &nbsp;发表
                        </button>
                    }
                </div>
                {!!this.state.img_tip &&
                    <p className="post-form-img-tip">
                        <a onClick={()=>{this.img_ref.current.value=""; this.on_img_change();}}>删除图片</a>
                        {this.state.img_tip}
                    </p>
                }
                <SafeTextarea ref={this.area_ref} id="new_post" on_change={this.on_change_bound} on_submit={this.on_submit.bind(this)} />
                <p><small>
                    请遵守<a href="http://pkuhelper.pku.edu.cn/treehole_rules.html" target="_blank">树洞管理规范</a>，文明发言
                </small></p>
            </form>
        )
    }
}