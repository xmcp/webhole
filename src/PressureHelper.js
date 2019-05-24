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
        this.esc_interval=null;
    }

    do_fire() {
        if(this.esc_interval) {
            clearInterval(this.esc_interval);
            this.esc_interval=null;
        }
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
        if(window.config.pressure) {
            Pressure.set(document.body, {
                change: (force)=>{
                    if(!this.state.fired) {
                        if(force>=.999) {
                            this.do_fire();
                        }
                        else
                            this.setState({
                                level: force,
                            });
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

            document.addEventListener('keydown',(e)=>{
                if(!e.repeat && e.key==='Escape') {
                    if(this.esc_interval)
                        clearInterval(this.esc_interval);
                    this.setState({
                        level: THRESHOLD/2,
                    },()=>{
                        this.esc_interval=setInterval(()=>{
                            let new_level=this.state.level+.1;
                            if(new_level>=.999)
                                this.do_fire();
                            else
                                this.setState({
                                    level: new_level,
                                });
                        },30);
                    });
                }
            });
            document.addEventListener('keyup',(e)=>{
                if(e.key==='Escape') {
                    if(this.esc_interval) {
                        clearInterval(this.esc_interval);
                        this.esc_interval=null;
                    }
                    this.setState({
                        level: 0,
                    });
                }
            });
        }
    }

    render() {
        const pad=MULTIPLIER*(this.state.level-THRESHOLD)-BORDER_WIDTH;
        return (
            <div className={
                'pressure-box'
                +(this.state.fired ? ' pressure-box-fired' : '')
                +(this.state.level<=.0001 ? ' pressure-box-empty' : '')
            } style={{
                left: pad,
                right: pad,
                top: pad,
                bottom: pad,
            }} />
        )
    }
}