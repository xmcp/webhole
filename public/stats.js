var _czc=_czc||[];
_czc.push(["_setAccount","1274501752"]);
_czc.push(["_setCustomVar","has_token",localStorage['TOKEN']?'yes':'no',1]);
_czc.push(["_setCustomVar","standalone",((window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone))?'yes':'no',1]);
_czc.push(["_setCustomVar","build_info","%REACT_APP_BUILD_INFO%"||'---']);
var cr_version=/Chrome\/(\d+)/.exec(navigator.userAgent);
_czc.push(["_setCustomVar","cr_version_test",cr_version?cr_version[1]:'[null]',2]);
/*
// track config
try {
    var config=JSON.parse(localStorage['hole_config']||'{}');
    for(var key in config)
        if(config.hasOwnProperty(key))
            _czc.push(["_trackEvent",'config',key,encodeURIComponent(JSON.stringify(config[key])),0,'']);
            //_czc.push(["_setCustomVar","config_"+key,encodeURIComponent(JSON.stringify(config[key])),0]);
} catch(e) {
    console.trace(e);
}
*/
var cnzz_s_tag = document.createElement('script');
cnzz_s_tag.type = 'text/javascript';
cnzz_s_tag.async = true;
cnzz_s_tag.charset = "utf-8";
cnzz_s_tag.src = "https://w.cnzz.com/c.php?id=1274501752&async=1";
document.head.appendChild(cnzz_s_tag);