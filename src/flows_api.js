import {API_BASE} from './Common';

export const API_VERSION_PARAM='&PKUHelperAPI=3.0';
export const PKUHELPER_ROOT= // don't use :10301 if we are already in the same domain
    (document.domain==='pkuhelper.com'||document.domain==='www.pkuhelper.com') ? '/' : 'http://pkuhelper.com:10301/';

function token_param(token) {
    return API_VERSION_PARAM + (token ? ('&user_token='+token) : '');
}

export const API={
    load_replies: (pid,token,color_picker)=>{
        return fetch(
            API_BASE+'/api.php?action=getcomment'+
            '&pid='+pid+
            token_param(token)
        )
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(json);

                json.data=json.data
                    .sort((a,b)=>{
                        return parseInt(a.timestamp,10)-parseInt(b.timestamp,10);
                    })
                    .map((info)=>{
                        info._display_color=color_picker.get(info.name);
                        info.variant={};
                        return info;
                    });

                return json;
            });
    },

    set_attention: (pid,attention,token)=>{
        let data=new URLSearchParams();
        data.append('user_token',token);
        data.append('pid',pid);
        data.append('switch',attention ? '1' : '0');
        return fetch(API_BASE+'/api.php?action=attention'+API_VERSION_PARAM, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg && json.msg==='已经关注过辣') {}
                    else {
                        if(json.msg) alert(json.msg);
                        throw new Error(json);
                    }
                }
                return json;
            });
    },

    report: (pid,reason,token)=>{
        let data=new URLSearchParams();
        data.append('user_token',token);
        data.append('pid',pid);
        data.append('reason',reason);
        return fetch(API_BASE+'/api.php?action=report'+API_VERSION_PARAM, {
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
                return json;
            });
    },

    get_list: (page,token)=>{
        return fetch(
            API_BASE+'/api.php?action=getlist'+
            '&p='+page+
            token_param(token)
        )
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(json);
                return json;
            });
    },

    get_search: (pagesize,keyword,token)=>{
        return fetch(
            API_BASE+'/api.php?action=search'+
            '&pagesize='+pagesize+
            '&keywords='+encodeURIComponent(keyword)+
            token_param(token)
        )
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(json);
                }
                return json;
            });
    },

    get_single: (pid,token)=>{
        return fetch(
            API_BASE+'/api.php?action=getone'+
            '&pid='+pid+
            token_param(token)
        )
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(json);
                }
                return json;
            });
    },

    get_attention: (token)=>{
        return fetch(
            API_BASE+'/api.php?action=getattention'+
            token_param(token)
        )
            .then((res)=>res.json())
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) alert(json.msg);
                    throw new Error(json);
                }
                return json;
            });
    },
};