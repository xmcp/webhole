import React, {Component} from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        console.log(error);
        return { error: error };
    }

    render() {
        if(this.state.error)
            return (
                <div style={{margin: '1em', userSelect: 'initial'}}>
                    <h1>Frontend Exception</h1>
                    <p>Please report this bug to developers.</p>
                    <hr />
                    <pre>{''+this.state.error}</pre>
                    <hr />
                    <pre>{this.state.error.stack||'(no stack info)'}</pre>
                </div>
            );
        else
            return this.props.children;
    }
}