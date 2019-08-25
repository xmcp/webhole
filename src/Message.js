import React, {Component, PureComponent} from 'react';
import {PKUHELPER_ROOT, get_json, API_VERSION_PARAM} from './flows_api';
import {Time} from './Common';

export class MessageViewer extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            loading_status: 'idle',
            msg: [],
        };
    }

    componentDidMount() {
        this.load();
    }

    load() {
        if(this.state.loading_status==='loading') return;
        this.setState({
            loading_status: 'loading',
        },()=>{
            fetch(PKUHELPER_ROOT+'api_xmcp/hole/system_msg?user_token='+encodeURIComponent(this.props.token)+API_VERSION_PARAM())
                .then(get_json)
                .then((json)=>{
                    if(json.error)
                        throw new Error(json.error);
                    else
                        this.setState({
                            loading_status: 'done',
                            msg: json.result,
                        });
                })
                .catch((err)=>{
                    console.error(err);
                    alert(''+err);
                    this.setState({
                        loading_status: 'failed',
                    });
                })

        });
    }

    render() {
        if(this.state.loading_status==='loading')
            return (<p className="box box-tip">加载中……</p>);
        else if(this.state.loading_status==='failed')
            return (<div className="box box-tip"><a onClick={()=>{this.load()}}>重新加载</a></div>);
        else if(this.state.loading_status==='done')
            return this.state.msg.map((msg)=>(
                <div className="box">
                    <div className="box-header">
                        <Time stamp={msg.timestamp} />
                        &nbsp; <b>{msg.title}</b>
                    </div>
                    <div className="box-content">
                        <pre>{msg.content}</pre>
                    </div>
                </div>
            ));
        else
            return null;
    }
}