import React, {Component, PureComponent} from 'react';
import {SafeTextarea} from './Common';
import {API_VERSION_PARAM,API} from './flows_api'
import md5 from 'md5';

import './UserAction.css';

import {API_BASE} from './Common';
const LOGIN_BASE=window.location.protocol==='https:' ? '/login_proxy' : 'http://www.pkuhelper.com:10301/services/login';
const MAX_IMG_PX=2000;
const MAX_IMG_FILESIZE=256000;

const ISOP_APPKEY='0feb3a8a831e11e8933a0050568508a5';
const ISOP_APPCODE='0fec960a831e11e8933a0050568508a5';
const ISOP_SVCID='PERSON_BASE_INFO,STUDENT_SCORE,STUDENT_COURSE_TABLE,STUDENT_COURSE_TABLE_ROOM,CARD_BALANCE';

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
        this.input_token_ref=React.createRef();
    }

    do_sendcode() {
        if(this.state.loading_status==='loading')
            return;

        let param=
            'user='+this.username_ref.current.value+
            '&svcId='+ISOP_SVCID+
            '&appKey='+ISOP_APPKEY+
            '&timestamp='+(+new Date());

        fetch(
            'https://isop.pku.edu.cn/svcpub/svc/oauth/validcode?'+param+
            '&msg='+md5(param+ISOP_APPCODE),
            {mode: 'no-cors'}
        );
        alert('如果学号存在，短信验证码将会发到您的手机上，请注意查收！');
    }

    do_login(set_token) {
        if(this.state.loading_status==='loading')
            return;

        this.setState({
            loading_status: 'loading',
        },()=>{
            let data=new URLSearchParams();
            data.append('username', this.username_ref.current.value);
            data.append('valid_code', this.password_ref.current.value);
            data.append('isnewloginflow', 'true');
            fetch(LOGIN_BASE+'/login.php?platform=webhole', {
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

                    set_token(json.user_token);
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
        });
    }

    do_input_token(set_token) {
        if(this.state.loading_status==='loading')
            return;

        let token=this.input_token_ref.current.value;
        this.setState({
            loading_status: 'loading',
        },()=>{
            API.get_attention(token)
                .then((_)=>{
                    this.setState({
                        loading_status: 'done',
                    });
                    set_token(token);
                })
                .catch((e)=>{
                    alert('Token检验失败');
                    this.setState({
                        loading_status: 'done',
                    });
                    console.error(e);
                });
        });
    }

    render() {
        return (
            <TokenCtx.Consumer>{(token)=>
                <div className="login-form box">
                    {token.value ?
                        <div>
                            <p>
                                <b>您已登录。</b>
                                <button type="button" onClick={()=>{token.set_value(null);}}>注销</button>
                            </p>
                            <p>
                                User Token: <code>{token.value||'(null)'}</code> <br />
                                请勿泄露 User Token，它代表您的登录状态，与您的账户唯一对应且泄露后无法重置
                            </p>
                        </div> :
                        <div>
                            <p>登录后可以使用关注、回复等功能</p>
                            <p>
                                <label>
                                    　学号&nbsp;
                                    <input ref={this.username_ref} type="tel" />
                                </label>
                                <button type="button" disabled={this.state.loading_status==='loading'}
                                        onClick={(e)=>this.do_sendcode()}>
                                    发送验证码
                                </button>
                            </p>
                            <p>
                                <label>
                                    验证码&nbsp;
                                    <input ref={this.password_ref} type="tel" />
                                </label>
                                <button type="button" disabled={this.state.loading_status==='loading'}
                                        onClick={(e)=>this.do_login(token.set_value)}>
                                    登录
                                </button>
                            </p>
                            <p>
                                登录请求会被发送到北大统一验证接口和 PKU Helper 服务器 <br />
                                我们不会记录或使用您的登录信息
                            </p>
                            <hr />
                            <p>从其他设备导入登录状态</p>
                            <p>
                                <input ref={this.input_token_ref} placeholder="User Token" />
                                <button type="button" disabled={this.state.loading_status==='loading'}
                                        onClick={(e)=>this.do_input_token(token.set_value)}>
                                    导入
                                </button>
                            </p>
                        </div>
                    }
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
        data.append('pid',this.props.pid);
        data.append('text',this.state.text);
        data.append('user_token',this.props.token);
        fetch(API_BASE+'/api.php?action=docomment'+API_VERSION_PARAM, {
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
            <form onSubmit={this.on_submit.bind(this)} className={'reply-form box'+(this.state.text?' reply-sticky':'')}>
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
        data.append('text',this.state.text);
        data.append('type',img ? 'image' : 'text');
        data.append('user_token',this.props.token);
        if(img)
            data.append('data',img);

        fetch(API_BASE+'/api.php?action=dopost'+API_VERSION_PARAM, {
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

    proc_img(file) {
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