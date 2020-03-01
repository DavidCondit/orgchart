export const clone = (data) => {
    return JSON.parse(JSON.stringify(data));
}; 

export const createSvgLine = (x1: number, y1: number, x2: number, y2: number, classList: string = null) => {
    let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttributeNS(null, 'x1', x1.toString());
    line.setAttributeNS(null, 'y1', y1.toString());
    line.setAttributeNS(null, 'x2', x2.toString());
    line.setAttributeNS(null, 'y2', y2.toString());
    if (classList != null) {
        line.setAttributeNS(null, 'class', classList);
    }
    return line;
}