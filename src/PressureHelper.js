import React, {Component} from 'react';
import Pressure from 'pressure';

import './PressureHelper.css';

const THRESHOLD=.4;
const MULTIPLIER=25;
const BORDER_WIDTH=500; // also change css!

export class PressureHelper extends  Component {
    constructor(props) {
        super(props);
        this.state={
            level: 0,
            fired: false,
        };
        this.callback=props.callback;
    }

    do_fire() {
        this.setState({
            level: 1,
            fired: true,
        });
        this.callback();
        window.setTimeout(()=>{
            this.setState({
                level: 0,
                fired: false,
            });
        },300);
    }

    componentDidMount() {
        if(localStorage['DISABLE_PRESSURE']!=='on') {            
            Pressure.set(document.body, {
                change: (force)=>{
                    if(!this.state.fired) {
                        this.setState({
                            level: force,
                        });
                        if(force===1)
                            this.do_fire();
                    }
                },
                end: ()=>{
                    this.setState({
                        level: 0,
                        fired: false,
                    });
                },
            }, {
                polyfill: false,
                only: 'touch',
                preventSelect: false,
            });
            document.body.addEventListener('selectstart',(event)=>{
                if(this.state.level>THRESHOLD)
                    event.preventDefault();
            });
        }
    }

    render() {
        const pad=MULTIPLIER*(this.state.level-THRESHOLD)-BORDER_WIDTH;
        return (
            <div className={'pressure-box '+(this.state.fired ? 'pressure-box-fired' : '')} style={{
                left: pad,
                right: pad,
                top: pad,
                bottom: pad,
            }} />
        )
    }
}