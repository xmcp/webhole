import React, {useState} from 'react';

import {GATEWAY_DOMAIN} from './Common';
import {get_json} from './flows_api';
import {bgimg_style} from './Config';

import './Welcome.css';

export function LandingPage(props) {
    let [username,set_username]=useState('');
    let [password,set_password]=useState('');
    let [loading,set_loading]=useState(false);

    function do_login() {
        set_loading(true);
        fetch(GATEWAY_DOMAIN+'/api/legacy/login',{
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: username,
                password: password,
            }),
        })
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                set_loading(false);
                props.do_login(json.user_token);
            })
            .catch((e)=>{
                alert('登录失败。'+e);
                set_loading(false);
            });
    }

    function on_keypress(e) {
        if(e.key==='Enter')
            do_login();
    }

    return (
        <div>
            <div className="bg-img bg-img-landing" style={bgimg_style('static/bg/default.png')} />
            <div className="title-bar title-bar-landing login-box-background">
                <div style={{height: '.75rem'}} />
                <div className="aux-margin">
                    <div className="title">
                        <p className="centered-line">
                        <span>_BRAND_NAME</span>
                        </p>
                        <p className="title-slogan">
                            _BRAND_SLOGAN
                        </p>
                    </div>
                </div>
            </div>
            <div className="landing-container">
                <div className="landing-container-side">
                    <div className="box login-box login-box-background">
                        <p className="login-box-title">
                            <a href="https://_BRAND_GATEWAY_DOMAIN/" target="_blank" rel="noopener">
                                <b><span className="icon icon-forward" /> 新用户注册</b>
                            </a>
                        </p>
                        <p>
                            _BRAND_REGISTER_SLOGAN
                        </p>
                    </div>
                    <div className="box login-box login-box-background">
                        <p className="login-box-title">
                            <b>已经有账号？</b>
                        </p>
                        <p>
                            <label>
                                注册邮箱{'　'}
                                <input value={username} onChange={(e)=>set_username(e.target.value)} autoFocus={true} />
                            </label>
                        </p>
                        <p>
                            <label>
                                {'　　'}密码{'　'}
                                <input value={password} type="password" onChange={(e)=>set_password(e.target.value)} onKeyPress={on_keypress} />
                            </label>
                        </p>
                        <p>
                            <button className="login-box-btn" onClick={do_login} disabled={loading}>
                                <span className="icon icon-login" /> &nbsp;登录
                            </button>
                            &nbsp; &nbsp;
                        </p>
                        <p>
                            <a href="https://_BRAND_GATEWAY_DOMAIN/users/recoverpw" target="_blank" rel="noopener">
                                <span className="icon icon-forward" /> 忘记密码
                            </a>
                        </p>
                    </div>
                </div>
                <div className="landing-container-content">
                    <div className="landing-content">
                        <h1>_BRAND_LANDING_HEADER</h1>
                        <p>
                            _BRAND_LANDING_BODY
                        </p>
                        <h1>_BRAND_LANDING_HEADER</h1>
                        <p>
                            _BRAND_LANDING_BODY
                        </p>
                        <h1>
                            <a href="https://_BRAND_GATEWAY_DOMAIN/" className="no-underline" target="_blank" rel="noopener">
                                <b><span className="icon icon-forward" /> 立即注册，_BRAND_SLOGAN</b>
                            </a>
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
}