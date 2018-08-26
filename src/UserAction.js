import React, {Component, PureComponent} from 'react';
import {SafeTextarea} from './Common';

import './UserAction.css';

import {API_BASE} from './Common';
const LOGIN_BASE=window.location.protocol==='https:' ? '/login_proxy' : 'http://www.pkuhelper.com/services/login';
const MAX_IMG_PX=1000;
const MAX_IMG_FILESIZE=100000;

export const TokenCtx=React.createContext({
    value: null,
    set_value: ()=>{},
});

export class LoginForm extends Component {
    constructor(props) {
        super(props);
        this.state={
            loading_status: 'done',
        };

        this.username_ref=React.createRef();
        this.password_ref=React.createRef();
    }

    do_login(event,set_token) {
        event.preventDefault();
        if(this.state.loading_status==='loading')
            return;

        this.setState({
            loading_status: 'loading',
        });
        let data=new URLSearchParams();
        data.append('uid', this.username_ref.current.value);
        data.append('password', this.password_ref.current.value);
        fetch(LOGIN_BASE+'/login.php?platform=hole_xmcp_ml', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(json);
                }

                set_token(json.token);
                alert(`成功以 ${json.name} 的身份登录`);
                this.setState({
                    loading_status: 'done',
                });
            })
            .catch((e)=>{
                alert('登录失败');
                this.setState({
                    loading_status: 'done',
                });
                console.error(e);
            });
    }

    render() {
        return (
            <TokenCtx.Consumer>{(token)=>
                <div className="login-form box">
                    <form onSubmit={(e)=>this.do_login(e,token.set_value)}>
                        <p>{token.value ?
                            <span><b>您已登录。</b>Token: <code>{token.value||'(null)'}</code></span> :
                            '登录后可以使用关注、回复等功能'
                        }</p>
                        <p>
                            <label>
                                学号：
                                <input ref={this.username_ref} type="tel" />
                            </label>
                        </p>
                        <p>
                            <label>
                                密码：
                                <input ref={this.password_ref} type="password" />
                            </label>
                        </p>
                        <p>
                            {this.state.loading_status==='loading' ?
                                <button disabled="disbled">
                                    <span className="icon icon-loading" />
                                    &nbsp;正在登录
                                </button> :
                                <button type="submit">
                                    <span className="icon icon-login" />
                                    &nbsp;登录
                                </button>
                            }
                            <button type="button" onClick={()=>{token.set_value(null);}}>退出</button>
                        </p>
                        <ul>
                            <li>我们不会记录您的密码和个人信息</li>
                            <li><b>请勿泄露 Token</b>，它代表您的登录状态，与您的账户唯一对应且泄露后无法重置</li>
                            <li>如果您不愿输入密码，可以直接修改 <code>localStorage['TOKEN']</code></li>
                        </ul>
                    </form>
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
        this.area_ref=React.createRef();
    }

    on_change(value) {
        this.setState({
            text: value,
        });
    }

    on_submit(event) {
        event.preventDefault();
        if(this.state.loading_status==='loading')
            return;
        this.setState({
            loading_status: 'loading',
        });

        let data=new URLSearchParams();
        data.append('action','docomment');
        data.append('pid',this.props.pid);
        data.append('text',this.state.text);
        data.append('token',this.props.token);
        fetch(API_BASE+'/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(json);
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
                alert('回复失败\n（树洞服务器经常抽风，其实有可能已经回复上了，不妨点“刷新回复”看一看）');
                this.setState({
                    loading_status: 'done',
                });
            });
    }

    render() {
        return (
            <form onSubmit={this.on_submit.bind(this)} className="reply-form box">
                <SafeTextarea ref={this.area_ref} id={this.props.pid} on_change={this.on_change_bound} />
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
        };
        this.img_ref=React.createRef();
        this.area_ref=React.createRef();
        this.on_change_bound=this.on_change.bind(this);
    }

    on_change(value) {
        this.setState({
            text: value,
        });
    }

    do_post(text,img) {
        let data=new URLSearchParams();
        data.append('action','dopost');
        data.append('text',this.state.text);
        data.append('type',img ? 'image' : 'text');
        data.append('token',this.props.token);
        if(img)
            data.append('data',img);

        fetch(API_BASE+'/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(json);
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

    proc_img(file) { // http://pkuhole.chenpong.com/
        return new Promise((resolve,reject)=>{
            function return_url(url) {
                const idx=url.indexOf(';base64,');
                if(idx===-1)
                    throw new Error('img not base64 encoded');

                resolve(url.substr(idx+8));
            }

            let reader=new FileReader();
            reader.onload=((event)=>{ // check size
                const url=event.target.result;
                const image = new Image();
                image.src=url;

                image.onload=(()=>{
                    let width=image.width;
                    let height=image.height;
                    if(width>MAX_IMG_PX) {
                        height=height*MAX_IMG_PX/width;
                        width=MAX_IMG_PX;
                    }
                    if(height>MAX_IMG_PX) {
                        width=width*MAX_IMG_PX/height;
                        height=MAX_IMG_PX;
                    }

                    let canvas=document.createElement('canvas');
                    let ctx=canvas.getContext('2d');
                    canvas.width=width;
                    canvas.height=height;
                    ctx.drawImage(image,0,0,width,height);

                    for(let quality=.9;quality>0;quality-=0.1) {
                        const url=canvas.toDataURL('image/jpeg',quality);
                        console.log('quality',quality,'size',url.length);
                        if(url.length<=MAX_IMG_FILESIZE) {
                            console.log('chosen img quality',quality);
                            return return_url(url);
                        }
                    }
                    // else
                    alert('图片过大，无法上传');
                    reject('img too large');
                });
            });
            reader.readAsDataURL(file);
        });
    }

    on_submit(event) {
        event.preventDefault();
        if(this.state.loading_status==='loading')
            return;
        if(this.img_ref.current.files.length) {
            this.setState({
                loading_status: 'processing',
            });
            this.proc_img(this.img_ref.current.files[0])
                .then((img)=>{
                    this.setState({
                        loading_status: 'loading',
                    });
                    this.do_post(this.state.text,img);
                })
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
                        <input ref={this.img_ref} type="file" accept="image/*"
                            {...this.state.loading_status!=='done' ? {disabled: true} : {}} />
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
                <SafeTextarea ref={this.area_ref} id="new_post" on_change={this.on_change_bound} />
            </form>
        )
    }
}