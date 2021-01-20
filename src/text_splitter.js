// regexp should match the WHOLE segmented part
export const BARE_PID_RE=/(^|[^\d\u20e3\ufe0e\ufe0f])([1-9]\d{4,5})(?![\d\u20e3\ufe0e\ufe0f])/g;
export const PFX_PID_RE=/(\$[1-9]\d{4,5})(?![\d\u20e3\ufe0e\ufe0f])/g;
export const URL_PID_RE=/((?:https?:\/\/)?_BRAND_WWW_DOMAIN\/?#(?:#|%23)([1-9]\d{4,5}))(?!\d|\u20e3|\ufe0e|\ufe0f)/g;
export const NORM_NICKNAME_RE=/(^|[^A-Za-z])((?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Jolly|Kind|Little|Magic|Naïve|Old|PKU|Quiet|Rich|Superman|THU|Undefined|Valuable|Wifeless|Xenial|Young|Zombie)\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \d+)?|洞主)(?![A-Za-z])/gi;
export const BRG_NICKNAME_RE=/(^|[^A-Za-z])((?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Grievous|Hungry|Interesting|Jolly|Kind|Little|Magic|Naïve|Old|PKU|Quiet|Rich|Spencer|THU|Undefined|Valuable|Wifeless|Xenial|Young|Zombie)\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hermione|Isabella|Jason|Kate|Luke|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Voldemort|Winnie|Xander|Yasmine|Zach)|You Win(?: \d+)?|洞主)(?![A-Za-z])/gi;
export const URL_RE=/(^|[^.@a-zA-Z0-9_])((?:https?:\/\/)?(?:(?:[\w-]+\.)+[a-zA-Z]{2,3}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d{1,5})?(?:\/[\w~!@#$%^&*()\-_=+[\]{};:,./?|]*)?)(?![a-zA-Z0-9])/gi;

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escape_regex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function build_highlight_re(txt,split,option='g') {
    return txt ? new RegExp(`(${txt.split(split).filter((x)=>!!x).map(escape_regex).join('|')})`,option) : /^$/g;
}

export function build_hl_rules(search_term=null, bridge=false) {
    let ret=[];

    // ↑ higher priority
    if(!bridge) ret.push(['url_pid',URL_PID_RE]);

    ret.push(['url',URL_RE]);

    ret.push(['pid_prefixed',PFX_PID_RE]);

    if(!bridge) ret.push(['pid_bare',BARE_PID_RE]);

    if(bridge) ret.push(['nickname',BRG_NICKNAME_RE]);
    else ret.push(['nickname',NORM_NICKNAME_RE]);

    if(search_term) ret.push(['search',build_highlight_re(search_term,' ','gi')]);

    return ret;
}

export function clean_pid(s) {
    if(s.charAt(0)==='#' || s.charAt(0)==='$') return parseInt(s.substr(1));
    else return parseInt(s);
}

export function split_text(txt,rules) {
    // rules: [['name',/regex/],...]
    // return: [['name','part'],[null,'part'],...]

    txt=[[null,txt]];
    rules.forEach((rule)=>{
        let [name,regex]=rule;
        txt=[].concat.apply([],txt.map((part)=>{
            let [rule,content]=part;
            if(rule) // already tagged by previous rules
                return [part];
            else {
                //console.log(txt,content,name);
                return content
                    .split(regex)
                    .map((seg)=>(
                        regex.test(seg) ? [name,seg] : [null,seg]
                    ))
                    .filter(([name,seg])=>(
                        name!==null || seg
                    ));
            }
        }));
    });
    return txt;
}
