import React, {Component, PureComponent} from 'react';
import {PKUHELPER_ROOT} from './infrastructure/const';
import {API_VERSION_PARAM, get_json} from './flows_api';
import {TokenCtx} from './UserAction';

import './BalanceShower.css';

export class BalanceShower extends PureComponent {
    constructor(props) {
        super(props);
        this.state={
            loading_status: 'idle',
            error: null,
            balance: null,
        };
    }

    do_load(e,token) {
        if(this.state.loading_status==='loading')
            return;
        if(e.target.closest('a')) // clicking at a link
            return;
        if(!token || !window.config.easter_egg) {
            this.setState({
                loading_status: 'idle',
            });
            return;
        }

        this.setState({
            loading_status: 'loading',
        },()=>{
            fetch(
                PKUHELPER_ROOT+'api_xmcp/isop/card_balance'
                +'?user_token='+encodeURIComponent(token)
                +API_VERSION_PARAM()
            )
                .then(get_json)
                .then((json)=>{
                    console.log(json);
                    if(!json.success)
                        throw new Error(JSON.stringify(json));

                    this.setState({
                        loading_status: 'done',
                        error: null,
                        balance: json.balance,
                    });
                })
                .catch((e)=>{
                    console.error(e);
                    this.setState({
                        loading_status: 'error',
                        error: ''+e,
                    });
                });
        })
    }

    render_popover() {
        if(this.state.loading_status==='idle') // no token or disabled
            return null;
        else if(this.state.loading_status==='loading')
            return (<div className="box box-tip">……</div>);
        else if(this.state.loading_status==='error')
            return (<div className="box box-tip balance-value"><a onClick={()=>{alert(this.state.error)}}>无法查询余额</a></div>);
        else if(this.state.loading_status==='done')
            return (<div className="box box-tip balance-value">校园卡 ￥{this.state.balance.toFixed(2)}</div>);
        else
            return null;
    }

    render() {
        return (
            <TokenCtx.Consumer>{(token)=>(
                <div onClick={(e)=>this.do_load(e,token.value)}>
                    <div className="balance-popover">{this.render_popover()}</div>
                    {this.props.children}
                </div>
            )}</TokenCtx.Consumer>
        )
    }
}