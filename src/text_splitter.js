export const PID_RE=/(^|[^\d])([1-9]\d{4,5})(?!\d|\u20e3|\ufe0e|\ufe0f)/g;
export const NICKNAME_RE=/(^|[^A-Za-z])((?:(?:Angry|Baby|Crazy|Diligent|Excited|Fat|Greedy|Hungry|Interesting|Japanese|Kind|Little|Magic|Naïve|Old|Powerful|Quiet|Rich|Superman|THU|Undefined|Valuable|Wifeless|Xiangbuchulai|Young|Zombie)\s)?(?:Alice|Bob|Carol|Dave|Eve|Francis|Grace|Hans|Isabella|Jason|Kate|Louis|Margaret|Nathan|Olivia|Paul|Queen|Richard|Susan|Thomas|Uma|Vivian|Winnie|Xander|Yasmine|Zach)|You Win(?: \d+)?|洞主)(?![A-Za-z])/gi;
export const URL_RE=/(^|[^.@a-zA-Z0-9_])((?:https?:\/\/)?(?:(?:[\w-]+\.)+[a-zA-Z]{2,3}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d{1,5})?(?:\/[\w~!@#$%^&*()\-_=+[\];,./?]*)?)(?![a-zA-Z0-9])/gi;
export const EASTER_EGG_KYOANI_RE=/(京都动画|京阿尼|京アニ)/g;

export function split_text(txt,rules) {
    // rules: [['name',/regex/],...]
    // return: [['name','part'],[null,'part'],...]

    if(window.config.easter_egg)
        rules=[...rules,['easter_egg_kyoani',EASTER_EGG_KYOANI_RE]];

    txt=[[null,txt]];
    rules.forEach((rule)=>{
        let [name,regex]=rule;
        txt=[].concat.apply([],txt.map((part)=>{
            let [rule,content]=part;
            if(rule) // already tagged by previous rules
                return [part];
            else {
                return content.split(regex).map((seg)=>(
                    regex.test(seg) ? [name,seg] : [null,seg]
                ));
            }
        }));
    });
    return txt;
}
