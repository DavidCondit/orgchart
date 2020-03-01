define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clone = function (data) {
        return JSON.parse(JSON.stringify(data));
    };
    exports.createSvgLine = function (x1, y1, x2, y2, classList) {
        if (classList === void 0) { classList = null; }
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttributeNS(null, 'x1', x1.toString());
        line.setAttributeNS(null, 'y1', y1.toString());
        line.setAttributeNS(null, 'x2', x2.toString());
        line.setAttributeNS(null, 'y2', y2.toString());
        if (classList != null) {
            line.setAttributeNS(null, 'class', classList);
        }
        return line;
    };
});
//# sourceMappingURL=org.helper.js.map