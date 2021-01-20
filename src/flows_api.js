import {HAPI_DOMAIN} from './Common';
import {cache} from './cache';

export function token_param(token) {
    return (
        '&jsapiver='+encodeURIComponent((process.env.REACT_APP_BUILD_INFO||'null')+'-'+(Math.floor(+new Date()/7200000)*2))+
        (token ? ('&user_token='+token) : '')
    );
}

export function get_json(res) {
    if(!res.ok) throw Error(`网络错误 ${res.status} ${res.statusText}`);
    return (
        res
            .text()
            .then((t)=>{
                try {
                    return JSON.parse(t);
                } catch(e) {
                    console.error('json parse error');
                    console.trace(e);
                    console.log(t);
                    throw new SyntaxError('JSON Parse Error '+t.substr(0,50));
                }
            })
    );
}

function add_variant(li) {
    li.forEach((item)=>{
        item.variant={};
    });
}
export const API={
    load_replies: (pid,token,color_picker)=>{
        pid=parseInt(pid);
        return fetch(
            HAPI_DOMAIN+'/api/holes/view/'+pid+
            '?role=reply'+ // add a pseudo parameter because token_param starts with '&'
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.error) {
                    throw new Error(json.error_msg||json.error);
                }

                cache().put(pid,json.post_data.hot,json);

                // also change load_replies_with_cache!
                json.post_data.variant={};
                json.data=json.data
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
            .then(([json,reason])=>{
                if(json) {
                    // also change load_replies!
                    json.post_data.variant={};
                    json.data=json.data
                        .map((info)=>{
                            info._display_color=color_picker.get(info.name);
                            info.variant={};
                            return info;
                        });

                    return json;
                }
                else {
                    return API.load_replies(pid,token,color_picker).then((json)=>{
                        if(reason==='expired')
                            json.post_data.variant.new_reply=true;
                        return json;
                    });
                }
            });
    },

    set_attention: (pid,attention,token)=>{
        return fetch(
            HAPI_DOMAIN+'/api/holes/attention/do/'+encodeURIComponent(pid)+
            '?switch='+(attention?'1':'0')+
            token_param(token),
            {method: 'PUT'}
        )
            .then(get_json)
            .then((json)=>{
                cache().delete(pid);
                if(json.error) {
                    alert(json.error_msg||json.error);
                    throw new Error(json.error);
                }
                json.data.variant={};
                return json;
            });
    },

    report: (item_type,id,report_type,reason,token)=>{
        if(item_type!=='hole' && item_type!=='comment') throw Error('bad type');
        return fetch(HAPI_DOMAIN+'/api/'+item_type+'s/flag/'+id+'?role=report'+token_param(token), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: reason,
                type: report_type,
            }),
        })
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                return json;
            });
    },

    get_list: (after,token)=>{
        return fetch(
            HAPI_DOMAIN+'/api/holes/list/'+(after||0)+
            '?limit=30'+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                add_variant(json.data);
                return json;
            });
    },

    get_search: (after,keyword,token)=>{
        return fetch(
            HAPI_DOMAIN+'/api/holes/search/'+after+
            '?keywords='+encodeURIComponent(keyword)+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                add_variant(json.data);
                return json;
            });
    },

    get_attention: (after,token)=>{
        return fetch(
            HAPI_DOMAIN+'/api/holes/attention/'+after+
            '?limit=30'+
            token_param(token)
        )
            .then(get_json)
            .then((json)=>{
                if(json.error)
                    throw new Error(json.error_msg||json.error);

                add_variant(json.data);
                return json;
            });
    },
};