import {get_json, API_VERSION_PARAM} from './infrastructure/functions';
import {PKUHELPER_ROOT} from './infrastructure/const';
import {API_BASE} from './Common';
import {cache} from './cache';

export {PKUHELPER_ROOT, API_VERSION_PARAM};

export function token_param(token) {
    return API_VERSION_PARAM()+(token ? ('&user_token='+token) : '');
}

export {get_json};

const SEARCH_PAGESIZE=50;

export const API={
    load_replies: (pid,token,color_picker,cache_version)=>{
        pid=parseInt(pid);
        return fetch(
            API_BASE+'/api.php?action=getcomment'+
            '&pid='+pid+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) throw new Error(json.msg);
                    else throw new Error(JSON.stringify(json));
                }

                cache().delete(pid).then(()=>{
                    cache().put(pid,cache_version,json);
                });

                // also change load_replies_with_cache!
                json.data=json.data
                    .sort((a,b)=>{
                        return parseInt(a.cid,10)-parseInt(b.cid,10);
                    })
                    .map((info)=>{
                        info._display_color=color_picker.get(info.name);
                        info.variant={};
                        return info;
                    });

                return json;
            });
    },

    load_replies_with_cache: (pid,token,color_picker,cache_version)=> {
        pid=parseInt(pid);
        return cache().get(pid,cache_version)
            .then((json)=>{
                if(json) {
                    // also change load_replies!
                    json.data=json.data
                        .sort((a,b)=>{
                            return parseInt(a.cid,10)-parseInt(b.cid,10);
                        })
                        .map((info)=>{
                            info._display_color=color_picker.get(info.name);
                            info.variant={};
                            return info;
                        });

                    return json;
                }
                else
                    return API.load_replies(pid,token,color_picker,cache_version);
            });
    },

    set_attention: (pid,attention,token)=>{
        let data=new URLSearchParams();
        data.append('user_token',token);
        data.append('pid',pid);
        data.append('switch',attention ? '1' : '0');
        return fetch(API_BASE+'/api.php?action=attention'+token_param(token), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        })
            .then(get_json)
            .then((json)=>{
                cache().delete(pid);
                if(json.code!==0) {
                    if(json.msg && json.msg==='已经关注过了') {}
                    else {
                        if(json.msg) alert(json.msg);
                        throw new Error(JSON.stringify(json));
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
        return fetch(API_BASE+'/api.php?action=report'+token_param(token), {
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
                return json;
            });
    },

    get_list: (page,token)=>{
        return fetch(
            API_BASE+'/api.php?action=getlist'+
            '&p='+page+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.code!==0)
                    throw new Error(JSON.stringify(json));
                return json;
            });
    },

    get_search: (page,keyword,token)=>{
        return fetch(
            API_BASE+'/api.php?action=search'+
            '&pagesize='+SEARCH_PAGESIZE+
            '&page='+page+
            '&keywords='+encodeURIComponent(keyword)+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) throw new Error(json.msg);
                    throw new Error(JSON.stringify(json));
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
            .then(get_json)
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) throw new Error(json.msg);
                    else throw new Error(JSON.stringify(json));
                }
                return json;
            });
    },

    get_attention: (token)=>{
        return fetch(
            API_BASE+'/api.php?action=getattention'+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.code!==0) {
                    if(json.msg) throw new Error(json.msg);
                    throw new Error(JSON.stringify(json));
                }
                return json;
            });
    },
};