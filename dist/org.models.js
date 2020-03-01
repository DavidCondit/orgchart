define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Point = /** @class */ (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    exports.Point = Point;
    var TreeData = /** @class */ (function () {
        function TreeData(id, parentId, name, title) {
            this.id = id;
            this.parentId = parentId;
            this.name = name;
            this.title = title;
        }
        return TreeData;
    }());
    exports.TreeData = TreeData;
    var TreeNodeModel = /** @class */ (function () {
        function TreeNodeModel(data, parent) {
            this.item = data;
            this.parent = parent;
        }
        TreeNodeModel.prototype.isLeaf = function () {
            return this.children.length === 0 || this.collapsed;
        };
        TreeNodeModel.prototype.getChildCount = function () {
            return this.children.length;
        };
        TreeNodeModel.prototype.getDescendantCount = function () {
            var countDescendants = function (children, counter) {
                for (var i = 0; i < children.length; i++) {
                    counter++;
                    var item = children[i];
                    if (item.getChildCount() > 0) {
                        counter = countDescendants(item.children, counter);
                    }
                }
                return counter;
            };
            return countDescendants(this.children, 0);
        };
        TreeNodeModel.prototype.isLeftMost = function () {
            if (this.parent === null) {
                return true;
            }
            else {
                return this.parent.children[0] === this;
            }
        };
        TreeNodeModel.prototype.isRightMost = function () {
            if (this.parent === null) {
                return true;
            }
            else {
                return this.parent.children[this.parent.children.length - 1] === this;
            }
        };
        TreeNodeModel.prototype.getPreviousSibling = function () {
            if (this.parent === null || this.isLeftMost()) {
                return null;
            }
            else {
                var index = this.parent.children.indexOf(this);
                return this.parent.children[index - 1];
            }
        };
        TreeNodeModel.prototype.getNextSibling = function () {
            if (this.parent === null || this.isRightMost()) {
                return null;
            }
            else {
                var index = this.parent.children.indexOf(this);
                return this.parent.children[index + 1];
            }
        };
        TreeNodeModel.prototype.getLeftMostSibling = function () {
            if (this.parent === null) {
                return null;
            }
            else if (this.isLeftMost()) {
                return this;
            }
            else {
                return this.parent.children[0];
            }
        };
        TreeNodeModel.prototype.getLeftMostChild = function () {
            if (this.children.length === 0) {
                return null;
            }
            else {
                return this.children[0];
            }
        };
        TreeNodeModel.prototype.getRightMostChild = function () {
            if (this.children.length === 0) {
                return null;
            }
            else {
                return this.children[this.children.length - 1];
            }
        };
        Object.defineProperty(TreeNodeModel.prototype, "toString", {
            get: function () {
                return this.item.id.toString();
            },
            enumerable: true,
            configurable: true
        });
        return TreeNodeModel;
    }());
    exports.TreeNodeModel = TreeNodeModel;
    var NodeContour = /** @class */ (function () {
        function NodeContour() {
        }
        return NodeContour;
    }());
    exports.NodeContour = NodeContour;
});
//# sourceMappingURL=org.models.js.map