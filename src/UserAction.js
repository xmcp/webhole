import React, {Component, PureComponent} from 'react';

import './UserAction.css';

const LOGIN_BASE=window.location.protocol==='https:' ? '/login_proxy' : 'http://www.pkuhelper.com/services/login';

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
                if(json.code!==0)
                    throw new Error(json);

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
                console.trace(e);
            });
    }

    render() {
        return (
            <TokenCtx.Consumer>{(token)=>
                <div className="login-form">
                    <form onSubmit={(e)=>this.do_login(e,token.set_value)} className="box">
                        <p>Token: <code>{token.value||'(null)'}</code></p>
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
                                <button disabled="disbled">正在登录……</button> :
                                <button type="submit">登录</button>
                            }
                            <button type="button" onClick={()=>{token.set_value(null);}}>退出</button>
                        </p>
                    </form>
                    <div className="box">
                        <ul>
                            <li>我们不会记录您的密码和个人信息。</li>
                            <li><b>请勿泄露 Token</b>，它代表您的登录状态，与您的账户唯一对应且泄露后无法重置。</li>
                            <li>如果您不愿输入密码，可以直接修改 <code>localStorage['TOKEN']</code></li>
                        </ul>
                    </div>
                </div>
            }</TokenCtx.Consumer>
        )
    }
}