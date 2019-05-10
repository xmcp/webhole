// https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/

const golden_ratio_conjugate=0.618033988749895;

export class ColorPicker {
    constructor() {
        this.names={};
        this.current_h=Math.random();
    }

    get(name) {
        name=name.toLowerCase();
        if(name==='洞主')
            return 'hsl(0,0%,97%)';
        if(!window.config.color_picker)
            return 'hsl(0,0%,85%)';

        if(!this.names[name]) {
            this.current_h+=golden_ratio_conjugate;
            this.current_h%=1;
            this.names[name]=`hsl(${this.current_h*360}, 40%, 87%)`;
        }
        return this.names[name];
    }
}