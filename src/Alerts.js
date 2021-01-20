import React, {useState, useEffect} from 'react';

export function Alerts(props) {
    let [external_alerts, set_external_alerts]=useState([]);

    useEffect(()=>{
        window._webhole_show_alert=(key,msg)=>{
            let new_alerts=external_alerts.slice().filter((x)=>x[0]!==key);
            if(msg)
                new_alerts.push([key,msg]);
            set_external_alerts(new_alerts);
        };
    },[external_alerts]);

    let alerts_to_show=props.info.alerts.concat(external_alerts.map(([_key,msg])=>msg));

    return (
        <div>
            <div id="global-hint-container" style={{display: 'none'}} />
            {!!window.__WEBHOLE_DEV_SERVER_FLAG &&
            <div className="flow-item-row">
                <div className="flow-item box box-danger">
                    CONNECTED TO DEV SERVER
                </div>
            </div>
            }
            {alerts_to_show.map((al,idx)=> {
                let clsname='flow-item box'+(al.type==='danger' ? ' box-danger' : al.type==='warning' ? ' box-warning' : '');
                if(al.is_html)
                    return (
                        <div key={idx} className="flow-item-row">
                            <div className={clsname} dangerouslySetInnerHTML={{__html: al.message}} />
                        </div>
                    );
                else
                    return (
                        <div key={idx} className="flow-item-row">
                            <div className={clsname}>{al.message}</div>
                        </div>
                    );
            })}
        </div>
    );
}