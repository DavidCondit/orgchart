define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MyEvent = /** @class */ (function () {
        function MyEvent() {
            this.listeners = [];
        }
        MyEvent.prototype.subscribe = function (obj, handler) {
            this.listeners.push({ obj: obj, handler: handler });
        };
        MyEvent.prototype.unsubscribe = function (obj) {
            for (var index = 0; index < this.listeners.length; index++) {
                var listener = this.listeners[index];
                if (listener.obj === obj) {
                    this.listeners.splice(index, 1);
                }
            }
        };
        ;
        MyEvent.prototype.notifyListeners = function (source, args) {
            this.listeners.forEach(function (value) {
                value.handler.call(value.obj, source, args);
            });
        };
        ;
        return MyEvent;
    }());
    exports.MyEvent = MyEvent;
});
//# sourceMappingURL=myevent.js.map