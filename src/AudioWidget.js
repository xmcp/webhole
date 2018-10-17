import React, {Component} from 'react';
import load from 'load-script';

window.audio_cache={};

function load_amrnb() {
    return new Promise((resolve,reject)=>{
        if(window.AMR)
            resolve();
        else
            load('static/amr_all.min.js', (err)=>{
                if(err)
                    reject(err);
                else
                    resolve();
            });
    });
}

export class AudioWidget extends Component {
    constructor(props) {
        super(props);
        this.state={
            url: this.props.src,
            state: 'waiting',
            data: null,
        };
    }

    load() {
        if(window.audio_cache[this.state.url]) {
            this.setState({
                state: 'loaded',
                data: window.audio_cache[this.state.url],
            });
            return;
        }

        console.log('fetching audio',this.state.url);
        this.setState({
            state: 'loading',
        });
        Promise.all([
            fetch(this.state.url),
            load_amrnb(),
        ])
            .then((res)=>{
                res[0].blob().then((blob)=>{
                    const reader=new FileReader();
                    reader.onload=(event)=>{
                        const raw=new window.AMR().decode(event.target.result);
                        if(!raw) {
                            alert('audio decoding failed');
                            return;
                        }
                        const wave=window.PCMData.encode({
                            sampleRate: 8000,
                            channelCount: 1,
                            bytesPerSample: 2,
                            data: raw
                        });
                        const binary_wave=new Uint8Array(wave.length);
                        for(let i=0;i<wave.length;i++)
                            binary_wave[i]=wave.charCodeAt(i);

                        const objurl=URL.createObjectURL(new Blob([binary_wave], {type: 'audio/wav'}));
                        window.audio_cache[this.state.url]=objurl;
                        this.setState({
                            state: 'loaded',
                            data: objurl,
                        });
                    };
                    reader.readAsBinaryString(blob);
                });
                this.setState({
                    state: 'decoding',
                });
            });
    }

    render() {
        if(this.state.state==='waiting')
            return (<p><a onClick={this.load.bind(this)}>加载音频</a></p>);
        if(this.state.state==='loading')
            return (<p>正在下载……</p>);
        else if(this.state.state==='decoding')
            return (<p>正在解码……</p>);
        else if(this.state.state==='loaded')
            return (<p><audio src={this.state.data} controls /></p>);
    }
}