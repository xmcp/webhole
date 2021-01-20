import React, {useState, useEffect} from 'react';
import {get_json, token_param} from './flows_api';
import {Time, HAPI_DOMAIN} from './Common';

const FOLD_LENGTH=100;
function FoldedPre(props) {
    let [folded,set_folded]=useState(()=>props.text.length>FOLD_LENGTH);

    let showing_text=folded ? props.text.substr(0,FOLD_LENGTH) : props.text;
    return (
        <pre>
            {showing_text}
            {folded &&
                <>
                    …&nbsp;
                    <a onClick={()=>set_folded(false)}>展开</a>
                </>
            }
        </pre>
    );
}

export function MessageViewer(props) {
    let [res,set_res]=useState(null);

    useEffect(()=>{
        fetch(HAPI_DOMAIN+'/api/messages/list?role=msg'+token_param(props.token))
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                set_res(json.data);
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

    return (
        <div>
            {res.map((msg)=>(
                <div className="box">
                    <div className="box-header">
                        <Time stamp={msg.created_at} />
                        &nbsp;<b>{msg.title||'通知'}</b>
                    </div>
                    <div className="box-content">
                        <FoldedPre text={msg.content} />
                    </div>
                </div>
            ))}
            {res.length===0 &&
                <div className="box box-tip">
                    暂无系统消息
                </div>
            }
        </div>
    );
}