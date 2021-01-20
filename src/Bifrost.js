import React, {PureComponent, useState, useContext, useEffect} from 'react';
import {TokenCtx} from './UserAction';

import {HAPI_DOMAIN} from './Common';
import {token_param, get_json} from './flows_api';

import './Bifrost.css';

function PortletSetTag(props) {
    let [content,set_content]=useState(props.info.tag||'');
    let [loading,set_loading]=useState(false);

    function submit() {
        set_loading(true);
        fetch(HAPI_DOMAIN+'/api/'+(props.is_reply?'comment':'hole')+'s/tag/'+props.id+'?role=tag'+token_param(props.token), {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                }),
        })
            .then(get_json)
            .then((json)=>{
                set_loading(false);
                if(json.error)
                    alert(json.error_msg || json.error);
                else
                    alert('提交成功');
            })
            .catch((e)=>{
                alert('Error: '+e);
                set_loading(false);
            });
    }

    return (
        <div>
            <button onClick={submit} disabled={loading}>提交</button>
            <input value={content} onChange={(e)=>set_content(e.target.value)} />
        </div>
    );
}

function PortletSetText(props) {
    let [content,set_content]=useState(props.info.text);
    let [loading,set_loading]=useState(false);

    function submit() {
        set_loading(true);
        fetch(HAPI_DOMAIN+'/api/'+(props.is_reply?'comment':'hole')+'s/edit/'+props.id+'?role=text'+token_param(props.token), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: content,
            }),
        })
            .then(get_json)
            .then((json)=>{
                set_loading(false);
                if(json.error)
                    alert(json.error_msg || json.error);
                else
                    alert('提交成功');
            })
            .catch((e)=>{
                alert('Error: '+e);
                set_loading(false);
            });
    }

    return (
        <div>
            <button onClick={submit} disabled={loading}>提交</button>
            <br />
            <textarea value={content} onChange={(e)=>set_content(e.target.value)} />
        </div>
    );
}

function PortletSetExtra(props) {
    let [type,set_type]=useState(props.info.type);
    let [extra,set_extra]=useState(props.info.extra||'');
    let [loading,set_loading]=useState(false);

    function submit() {
        set_loading(true);
        fetch(HAPI_DOMAIN+'/api/'+(props.is_reply?'comment':'hole')+'s/edit/'+props.id+'?role=extra'+token_param(props.token), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: type,
                extra: extra,
            }),
        })
            .then(get_json)
            .then((json)=>{
                set_loading(false);
                if(json.error)
                    alert(json.error_msg || json.error);
                else
                    alert('提交成功');
            })
            .catch((e)=>{
                alert('Error: '+e);
                set_loading(false);
            });
    }

    return (
        <div>
            <button onClick={submit} disabled={loading}>提交</button>
            <input value={type} list="hole-type-completer" onChange={(e)=>set_type(e.target.value)} />
            <datalist id="hole-type-completer">
                <option value="text" />
                <option value="image" />
                <option value="html" />
            </datalist>
            <br />
            <textarea value={extra} onChange={(e)=>set_extra(e.target.value)} />
        </div>
    );
}

function PortletViewFlag(props) {
    let [res,set_res]=useState('loading...');

    useEffect(()=>{
        fetch(HAPI_DOMAIN+'/api/'+(props.is_reply?'comment':'hole')+'s/flag/'+props.id+'?role=viewflag'+token_param(props.token))
            .then(get_json)
            .then((json)=>{
                set_res(JSON.stringify(json,null,2));
            })
            .catch((e)=>{
                set_res('Error: '+e);
            });
    },[]);

    return (
        <div style={{overflowX: 'auto'}}>
            <code className="pre">{res}</code>
        </div>
    )
}

function PortletUnban(props) {
    let [flag_unfold,set_flag_unfold]=useState(false);
    let [flag_undel,set_flag_undel]=useState(false);
    let [flag_unban,set_flag_unban]=useState(true);
    let [reason,set_reason]=useState('');
    let [loading,set_loading]=useState(false);

    function submit() {
        set_loading(true);
        fetch(HAPI_DOMAIN+'/api/'+(props.is_reply?'comment':'hole')+'s/unflag/'+props.id+'?role=unflag'+token_param(props.token), {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                unfold: flag_unfold,
                undelete: flag_undel,
                unban: flag_unban,
                reason: reason,
            }),
        })
            .then(get_json)
            .then((json)=>{
                set_loading(false);
                if(json.error)
                    alert(json.error_msg || json.error);
                else
                    alert('提交成功');
            })
            .catch((e)=>{
                alert('Error: '+e);
                set_loading(false);
            });
    }

    return (
        <div>
            <button onClick={submit} disabled={loading}>提交</button>
            <label>
                <input type="checkbox" checked={flag_unfold} onChange={(e)=>set_flag_unfold(e.target.checked)} />
                取消折叠
            </label>&nbsp;
            <label>
                <input type="checkbox" checked={flag_undel} onChange={(e)=>set_flag_undel(e.target.checked)} />
                取消删除
            </label>&nbsp;
            <label>
                <input type="checkbox" checked={flag_unban} onChange={(e)=>set_flag_unban(e.target.checked)} />
                解禁用户
            </label>&nbsp;
            <input value={reason} onChange={(e)=>set_reason(e.target.value)} placeholder="原因" />
        </div>
    )
}

export function should_show_bifrost_bar(perm) {
    return perm.Tagging || perm.EditingText || perm.EditingTypeExtra || perm.ViewingFlags || perm.UndoBan;
}

export function BifrostBar(props) {
    let {perm,value: token}=useContext(TokenCtx);
    let [mode,set_mode]=useState(null);

    let id=(props.is_reply ? props.info.cid : props.info.pid);

    let modes=[];
    if(perm.Tagging) modes.push('set_tag');
    if(perm.EditingText) modes.push('set_text');
    if(perm.EditingTypeExtra) modes.push('set_extra');
    if(perm.ViewingFlags) modes.push('view_flag');
    if(perm.UndoBan) modes.push('unban');

    const widgets={
        set_tag: PortletSetTag,
        set_text: PortletSetText,
        set_extra: PortletSetExtra,
        view_flag: PortletViewFlag,
        unban: PortletUnban,
    };
    const names={
        set_tag: '修改Tag',
        set_text: '修改内容',
        set_extra: '修改附加内容',
        view_flag: '查看举报',
        unban: '解除删帖',
    };
    let Widget;

    if(modes.length===0)
        return (
            <div className="interactive flow-item-toolbar bifrost-toolbar">
                <button onClick={()=>props.set_variant({show_bifrost: false})}>关闭</button>
                &nbsp; 没有可用的操作
            </div>
        );
    else {
        Widget=widgets[mode]||(()=>null);
        return (
            <div className="interactive flow-item-toolbar bifrost-toolbar">
                <p className="bifrost-portlet-selector">
                    <button onClick={()=>props.set_variant({show_bifrost: false})} style={{float: 'right'}}>关闭</button>
                    {modes.map((m)=>(
                        <button key={m} onClick={()=>set_mode(m)} disabled={mode===m}>
                            {names[m]}
                        </button>
                    ))}
                </p>
                <Widget {...props} perm={perm} id={id} token={token} />
            </div>
        )
    }
}