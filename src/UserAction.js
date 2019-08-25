import React, {Component, PureComponent} from 'react';
import copy from 'copy-to-clipboard';
import {API_BASE,SafeTextarea} from './Common';
import {MessageViewer} from './Message';
import {API_VERSION_PARAM,PKUHELPER_ROOT,API,get_json} from './flows_api';

import './UserAction.css';

const LOGIN_BASE=PKUHELPER_ROOT+'services/login';

const BASE64_RATE=4/3;
const MAX_IMG_DIAM=8000;
const MAX_IMG_PX=6000000;
const MAX_IMG_FILESIZE=450000*BASE64_RATE;

export const TokenCtx=React.createContext({
    value: null,
    set_value: ()=>{},
});

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
    constructor(props) {
        super(props);
        this.state={
            loading_status: 'done',
        };

        this.username_ref=React.createRef();
        this.password_ref=React.createRef();
        this.input_token_ref=React.createRef();
    }

    do_sendcode(api_name) {
        if(this.state.loading_status==='loading')
            return;

        this.setState({
            loading_status: 'loading',
        },()=>{
            fetch(
                PKUHELPER_ROOT+'api_xmcp/isop/'+api_name
                +'?user='+encodeURIComponent(this.username_ref.current.value)
                +API_VERSION_PARAM()
            )
                .then(get_json)
                .then((json)=>{
                    console.log(json);
                    if(!json.success)
                        throw new Error(JSON.stringify(json));

                    alert(json.msg);
                    this.setState({
                        loading_status: 'done',
                    });
                })
                .catch((e)=>{
                    console.error(e);
                    alert('发送失败。'+e);
                    this.setState({
                        loading_status: 'done',
                    });
                });

        });
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
            fetch(LOGIN_BASE+'/login.php?platform=webhole'+API_VERSION_PARAM(), {
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

                    let freshman_welcome=json.uid.indexOf('19')===0 && (+new Date())<1567958400000; // 2019-09-09 0:00 GMT+8
                    set_token(json.user_token);
                    alert(`成功以 ${json.name} 的身份登录`+(freshman_welcome ? '\n欢迎来到北京大学！' : ''));
                    this.setState({
                        loading_status: 'done',
                    });
                })
                .catch((e)=>{
                    console.error(e);
                    alert('登录失败');
                    this.setState({
                        loading_status: 'done',
                    });
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
                    alert('Token检验失败\n'+e);
                    this.setState({
                        loading_status: 'done',
                    });
                    console.error(e);
                });
        });
    }

    copy_token(token) {
        if(copy(token))
            alert('复制成功！\n请一定不要泄露哦');
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
                                <br />
                            </p>
                            <p>
                                根据计算中心要求，访问授权三个月内有效。<br />若提示“授权过期”，请注销后重新登录。
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
                        <div>
                            <p>接收验证码来登录 PKU Helper</p>
                            <p>
                                <label>
                                    　学号&nbsp;
                                    <input ref={this.username_ref} type="tel" />
                                </label>
                                <span className="login-type">
                                    <a onClick={(e)=>this.do_sendcode('validcode')}>
                                        &nbsp;短信&nbsp;
                                    </a>
                                    /
                                    <a onClick={(e)=>this.do_sendcode('validcode2mail')}>
                                        &nbsp;邮件&nbsp;
                                    </a>
                                </span>
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

    componentDidMount() {
        document.addEventListener('keypress',(e)=>{
            if(e.code==='Enter' && !e.ctrlKey && !e.altKey && ['input','textarea'].indexOf(e.target.tagName.toLowerCase())===-1) {
                if(this.area_ref.current) {
                    e.preventDefault();
                    this.area_ref.current.focus();
                }
            }
        });
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
        fetch(API_BASE+'/api.php?action=docomment'+API_VERSION_PARAM(), {
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

        fetch(API_BASE+'/api.php?action=dopost'+API_VERSION_PARAM(), {
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
            reader.onload=((event)=>{ // check size
                const url=event.target.result;
                const image = new Image();
                image.src=url;

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
            });
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