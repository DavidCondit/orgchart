define(["require", "exports", "./org.models", "./org.helper", "./myevent"], function (require, exports, org_models_1, org_helper_1, myevent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var OrgChart = /** @class */ (function () {
        function OrgChart(baseElement, nodesPanelElement, edgesPanelElement) {
            var _this = this;
            this.NODE_SIZE = 1;
            this.SIBLING_DISTANCE = 0;
            this.TREE_DISTANCE = 0;
            this.NODE_Y_OFFSET = -1.2;
            this.NODE_MARGIN_X = 8;
            this.NODE_MARGIN_Y = 60;
            this.NODE_HEIGHT = 55;
            this.NODE_WIDTH = 165;
            /**
             * Returns a single root TreeNodeModel, matching `rootId`, containing children and descendent TreeNodeModel items,
             * sorted at each children level by label in ascending order.
             *
             * @param data - All tree data.
             * @param rootId - The desired top-level root node's id.
             *
             * @returns A single root TreeNodeModel, populated with children TreeNodeModel items and their descendents.
             *
             */
            this.createTreeNodeModelFromTreeData = function (data, rootId) {
                if (rootId === void 0) { rootId = 0; }
                var root = data.filter(function (r) { return r.id === rootId; })[0];
                var rootTreeNode = new org_models_1.TreeNodeModel(root, null);
                // Add tree node children recursively.
                rootTreeNode.children = _this.getChildNodes(data, rootTreeNode);
                // Sort tree children and descendent children recursively by "Label" 
                // property in ascending order.
                var sortData = function (data) {
                    data.children.sort(function (a, b) {
                        if (a.item.name < b.item.name) {
                            return -1;
                        }
                        else {
                            return 1;
                        }
                        ;
                    });
                    for (var i = 0; i < data.children.length; i++) {
                        var child = data.children[i];
                        if (child.children.length > 0) {
                            sortData(child);
                        }
                    }
                };
                sortData(rootTreeNode);
                return rootTreeNode;
            };
            /**
             * Returns an array of TreeNodeModel items, which are the children of `parent`.
             * Each child TreeNodeModel item of `parent` is recursively populated with children (and descendent) TreeNodeModel items.
             *
             * @param data - All org chart data.
             * @param parent - The parent TreeNodeModel for which `data` will be filtered and added as children of `parent`.
             *
             * @returns Child TreeNodeModel items of `parent`.
             *
             */
            this.getChildNodes = function (data, parent) {
                var nodes = [];
                var childItems = data.filter(function (item) { return item.parentId === parent.item.id; });
                childItems.forEach(function (item) {
                    var treeNode = new org_models_1.TreeNodeModel(item, parent);
                    treeNode.children = _this.getChildNodes(data, treeNode);
                    nodes.push(treeNode);
                });
                return nodes;
            };
            /**
             * Determines whether _rootNode is "ROOT," ie the top-most TreeData item of all chart data.
             *
             * @returns Boolean determine whether _rootNode is ROOT.
             *
             */
            this.rootNodeIsRoot = function () {
                return _this._rootNode.item == null ? false : _this._rootNode.item.id === 0;
            };
            this.clearRenderedNodesAndEdges = function () {
                // Clear the existing tree nodes and edges.
                _this._nodesPanelElement.innerHTML = '';
                _this._edgesPanelElement.innerHTML = '';
                // IE requires SVG items to be cleared this way: Get the SVG container's parent element and then replace its child 
                // (SVG container) with a shallow-clone of its child (ie SVG container less its own child elements, like lines).
                _this._edgesPanelElement.parentNode.replaceChild(_this._edgesPanelElement.cloneNode(false), _this._edgesPanelElement);
                // Since the SVG container element was replaced, get a reference to the replacement element. 
                _this._edgesPanelElement = document.getElementById('tree-edges');
            };
            this.centerHorizontalScrollTreePanelOnNode = function (nodeId) {
                // Scroll to the node element, less half of the org chart "tree" client-width (visible-width).     
                var rootNode = document.querySelector("[data-item-id=\"" + nodeId + "\"]");
                if (rootNode == null) {
                    return;
                }
                var nodeLeftX = parseInt(rootNode.style.left);
                var scrollLeftX = nodeLeftX - (_this._baseElement.clientWidth / 2);
                _this._baseElement.scrollTop = 0;
                _this._baseElement.scrollLeft = scrollLeftX;
            };
            /**
             * Recursively sets a TreeNodeModel's and its children's and their descendents' x, y, and mod properties.
             * x is set to -1, y is set to the current level of recursion, and mod is set to 0.
             *
             * @param node - The root TreeNodeModel.
             * @param depth - The level of recursion, which is incremented recursively by `initializeNodes` calling itself. Typically this value would begin at 0.
             * @param maxDepth - The max level nodes can be expanded at. Used to set a TreeNodeModel node's collapsed property.
             *
             * @returns The modified TreeNodeModel.
             *
             */
            this.initializeNodes = function (node, depth, persistCollapsedState, maxDepth) {
                if (persistCollapsedState === void 0) { persistCollapsedState = false; }
                if (maxDepth === void 0) { maxDepth = -1; }
                node.x = -1;
                node.y = depth;
                node.mod = 0;
                if (!persistCollapsedState) {
                    if (_this.rootNodeIsRoot()) {
                        node.collapsed = maxDepth === -1 ? false : depth > maxDepth;
                    }
                    else {
                        node.collapsed = maxDepth === -1 ? false : depth >= maxDepth;
                    }
                }
                node.children.forEach(function (child) {
                    _this.initializeNodes(child, depth + 1, persistCollapsedState, maxDepth);
                });
            };
            this.minContourKeyValue = function (contour) {
                var minValue;
                for (var key in contour) {
                    if (parseInt(key) < minValue || minValue === undefined) {
                        minValue = parseInt(key);
                    }
                }
                return minValue;
            };
            this.maxContourKeyValue = function (contour) {
                var maxValue;
                for (var key in contour) {
                    if (parseInt(key) > maxValue || maxValue === undefined) {
                        maxValue = parseInt(key);
                    }
                }
                return maxValue;
            };
            this.maxChildNodeWidth = function (node) {
                var maxWidth;
                node.children.forEach(function (child) {
                    if (child.width > maxWidth || maxWidth === undefined) {
                        maxWidth = child.width;
                    }
                });
                return maxWidth;
            };
            this.maxChildNodeHeight = function (node) {
                var maxHeight;
                node.children.forEach(function (child) {
                    if (child.height > maxHeight || maxHeight === undefined) {
                        maxHeight = child.height;
                    }
                });
                return maxHeight;
            };
            this.checkForTreeConflicts = function (node) {
                /*
                Compares the node's left-edge ALL of its sibling's right-edges, from it's left-most-sibling inward,
                to determine if any of its left-sibling's right-edges intersect this node's left-edge. The largest intersection
                value is used to determine how much this node needs to shift to the right so that it's left-edge doesn't intersect
                with any of its left siblings' right-edges.
                */
                var minimumDistanceBetweenTrees = _this.TREE_DISTANCE + _this.NODE_SIZE;
                var leftSibling = node.getLeftMostSibling();
                if (leftSibling === null) {
                    return;
                }
                var shortestDistanceBetweenTreeContours = minimumDistanceBetweenTrees;
                while (leftSibling !== null && leftSibling.item.id !== node.item.id) {
                    var leftContour = _this.getLeftContour(node, 0, new org_models_1.NodeContour());
                    var rightContour = _this.getRightContour(leftSibling, 0, new org_models_1.NodeContour());
                    for (var yLevel = _this.minContourKeyValue(leftContour); yLevel <= Math.min(_this.maxContourKeyValue(leftContour), _this.maxContourKeyValue(rightContour)); yLevel++) {
                        if ((leftContour[yLevel] - rightContour[yLevel]) < shortestDistanceBetweenTreeContours) {
                            shortestDistanceBetweenTreeContours = leftContour[yLevel] - rightContour[yLevel];
                        }
                    }
                    // Iterate to the right.
                    leftSibling = leftSibling.getNextSibling();
                }
                if (shortestDistanceBetweenTreeContours < minimumDistanceBetweenTrees) {
                    var shiftValue = minimumDistanceBetweenTrees - shortestDistanceBetweenTreeContours;
                    node.x += shiftValue;
                    node.mod += shiftValue;
                }
            };
            this.getLeftContour = function (node, modSum, values) {
                if (values[node.y] === undefined) {
                    values[node.y] = node.x + modSum;
                }
                else {
                    values[node.y] = Math.min(values[node.y], node.x + modSum);
                }
                if (!node.collapsed) {
                    modSum += node.mod;
                    node.children.forEach(function (child) {
                        values = _this.getLeftContour(child, modSum, values);
                    });
                }
                return values;
            };
            this.getRightContour = function (node, modSum, values) {
                if (values[node.y] === undefined) {
                    values[node.y] = node.x + modSum;
                }
                else {
                    values[node.y] = Math.max(values[node.y], node.x + modSum);
                }
                if (!node.collapsed) {
                    modSum += node.mod;
                    node.children.forEach(function (child) {
                        values = _this.getRightContour(child, modSum, values);
                    });
                }
                return values;
            };
            this.calculateInitialX = function (node) {
                // Do a post-order traversal (ie iterate nodes from the bottom-left to the top-right).
                node.children.forEach(function (child) {
                    _this.calculateInitialX(child);
                });
                if (node.isLeaf()) {
                    if (!node.isLeftMost()) {
                        // node doesn't have children and isn't the left-most of its siblings (ie NOT the first child of its parent node),
                        // so set its x equal to it's left sibling + NODE_SIZE + SIBLING_DISTANCE.
                        node.x = node.getPreviousSibling().x + _this.NODE_SIZE + _this.SIBLING_DISTANCE;
                    }
                    else {
                        // node is the left-most of its siblings, if it even has siblings. Set its x equal to 0.
                        node.x = 0;
                    }
                }
                else if (node.getChildCount() === 1) {
                    if (node.isLeftMost()) {
                        // node has 1 child node and node is the left-most of its siblings, if it even has siblings.
                        // Set node's x equal to its only child's x to position it directly above its child.
                        node.x = node.getLeftMostChild().x;
                    }
                    else {
                        // node has 1 child node, but it isn't the left-most of its siblings. 
                        // Set node's x equal to its left-sibling + NODE_SIZE + SIBLING_DISTANCE.
                        node.x = node.getPreviousSibling().x + _this.NODE_SIZE + _this.SIBLING_DISTANCE;
                        // node's x is positioned to the right of its left-sibling, so its single-child node needs to be
                        // shifted underneath its parent. Set node's mod equal to the distance the single-child node needs
                        // to shift to be underneath node. Later, we'll use each parent node's mod value to update its child nodes'
                        // x values, so they'll all shift underneath their parents.         
                        node.mod = node.x - node.getLeftMostChild().x;
                    }
                }
                else {
                    // node has more than one child nodes, so get the midpoint difference of its left-most child node and its
                    // right-most child node.
                    var childrenNodesMidpointX = (node.getLeftMostChild().x + node.getRightMostChild().x) / 2;
                    if (node.isLeftMost()) {
                        // node is the left-most of its siblings, if it even has siblings.
                        // Set node's x equal to its children's midpoint value to position it directly above its children.
                        node.x = childrenNodesMidpointX;
                    }
                    else {
                        // node isn't the left-most of its siblings, so set its x equal to its left-sibling's x + NODE_SIZE + SIBLING_DISTANCE.
                        node.x = node.getPreviousSibling().x + _this.NODE_SIZE + _this.SIBLING_DISTANCE;
                        // node's x is positioned to the right of its left-sibling, so its child nodes need to be
                        // shifted underneath their parent. Set node's mod equal to the distance the children nodes needs
                        // to shift to be underneath node. Later, we'll use each parent node's mod value to update its child nodes'
                        // x values, so the'll all shift underneath their parents.                 
                        node.mod = node.x - childrenNodesMidpointX;
                    }
                }
                if (!node.isLeaf() && !node.isLeftMost()) {
                    _this.checkForTreeConflicts(node);
                }
            };
            this.checkAllChildrenOnScreen = function (rootNode) {
                /*
                    Get rootNode's left-contour. If any of its left-contour's x values are less than 0,
                    set shiftValue equal to the negative x value as the inverse positive x value.
                */
                var leftContour = _this.getLeftContour(rootNode, 0, new org_models_1.NodeContour());
                var shiftAmount = 0;
                for (var y in leftContour) {
                    if (leftContour[y] + shiftAmount < 0) {
                        shiftAmount = (leftContour[y] * -1);
                    }
                }
                // If shiftAmount is greater than 0, increment rootNode's x and mod values by shiftAmount,
                // ensuring the tree isn't positioned beyond the left border of whatever UI panel it'll be 
                // rendered in.
                if (shiftAmount > 0) {
                    rootNode.x += shiftAmount;
                    rootNode.mod += shiftAmount;
                }
            };
            this.centerMiddleLeafNodes = function (node) {
                /*
                This method iterate's node's children, right-to-left. If the iterated child is a leaf and is positioned somewhere
                in the middle (between it's parent's left-most and right-most child nodes), the iterated child is positioned between
                it's immediate left and right siblings. If the iterated child has children, it isn't centered but this method is called
                recursively for the child's children, as the child's children might have middle positioned leaf nodes that need to be centered,
                so on and so forth.
                */
                for (var i = node.children.length - 1; i >= 0; i--) {
                    var child = node.children[i];
                    if (child.isLeaf() && !child.isLeftMost() && !child.isRightMost()) {
                        var leftSiblingX = child.getPreviousSibling().x;
                        var rightSiblingX = child.getNextSibling().x;
                        var centerValue = (rightSiblingX + leftSiblingX) / 2;
                        child.x = centerValue;
                    }
                    if (!child.isLeaf()) {
                        _this.centerMiddleLeafNodes(child);
                    }
                }
            };
            this.calculateFinalPositions = function (node, modSum) {
                node.x += modSum;
                modSum += node.mod;
                // Post-order traversal.
                node.children.forEach(function (child) {
                    _this.calculateFinalPositions(child, modSum);
                });
                if (node.isLeaf()) {
                    node.width = node.x;
                    node.height = node.y;
                }
                else {
                    node.width = _this.maxChildNodeWidth(node);
                    node.height = _this.maxChildNodeHeight(node);
                }
            };
            this.calculatePanelControlSize = function (rootNode, panel) {
                var treeWidth = rootNode.width + 1;
                var treeHeight = rootNode.height + 1;
                if (_this.rootNodeIsRoot()) {
                    treeHeight--;
                }
                // Width is the (# of nodes wide * NODE_WIDTH) + ((# of nodes wide + 1) * NODE_MARGIN_X).
                var panelWidth = (treeWidth * _this.NODE_WIDTH) + ((treeWidth + 1) * _this.NODE_MARGIN_X);
                // Height is the (# of nodes tall * NODE_HEIGHT) + ((# of nodes tall + 1) * NODE_MARGIN_Y).
                var panelHeight = (treeHeight * _this.NODE_HEIGHT) + ((treeHeight + 1) * _this.NODE_MARGIN_Y);
                panel.style.width = panelWidth + 'px';
                panel.style.height = panelHeight + 'px';
            };
            this.drawNode = function (node, nodesPanelElement, edgesPanelElement) {
                if (node.parent && node.parent.collapsed) {
                    return;
                }
                // Calculate node's x coordinate in pixels.
                var x = (_this.NODE_MARGIN_X + (node.x * (_this.NODE_WIDTH + _this.NODE_MARGIN_X)));
                // Calculate node's y coordinate in pixels.
                var y = (_this.NODE_MARGIN_Y + ((node.y + _this.NODE_Y_OFFSET) * (_this.NODE_HEIGHT + _this.NODE_MARGIN_Y)));
                // Calculate node's top-middle and bottom-middle points.
                var nodeTopMiddlePoint = new org_models_1.Point(x + (_this.NODE_WIDTH / 2), y);
                var nodeBottomMiddlePoint = new org_models_1.Point(nodeTopMiddlePoint.x, y + _this.NODE_HEIGHT);
                // Draw the node, unless the node is the ROOT.
                if (node.item.id !== 0) {
                    var nodeElement = document.createElement('div');
                    nodeElement.classList.add('node');
                    nodeElement.style.width = _this.NODE_WIDTH + 'px';
                    nodeElement.style.height = _this.NODE_HEIGHT + 'px';
                    nodeElement.style.left = x + 'px';
                    nodeElement.style.top = y + 'px';
                    nodeElement.dataset.itemId = node.item.id.toString();
                    var nodeContent = document.createElement('div');
                    nodeContent.classList.add('node__content');
                    var nodeLink = document.createElement('a');
                    nodeLink.classList.add('node__content__link');
                    nodeLink.innerHTML = node.item.name;
                    var nodeTitle = document.createElement('div');
                    nodeTitle.classList.add('node__content__title');
                    nodeTitle.innerHTML = node.item.title;
                    nodeContent.appendChild(nodeLink);
                    nodeContent.appendChild(nodeTitle);
                    var childCount = node.getChildCount();
                    if (childCount > 0) {
                        var childCountElement = document.createElement('span');
                        childCountElement.classList.add('child-count');
                        childCountElement.innerHTML = "" + childCount;
                        nodeContent.appendChild(childCountElement);
                    }
                    nodeElement.appendChild(nodeContent);
                    nodesPanelElement.appendChild(nodeElement);
                }
                else {
                    // Draw ROOT as a hidden element so the chart can be center-scrolled on it by other code.
                    var nodeElement = document.createElement('div');
                    nodeElement.classList.add('node');
                    nodeElement.style.width = _this.NODE_WIDTH + 'px';
                    nodeElement.style.height = _this.NODE_HEIGHT + 'px';
                    nodeElement.style.left = x + 'px';
                    nodeElement.style.top = y + 'px';
                    nodeElement.style.display = 'none';
                    nodeElement.dataset.itemId = node.item.id.toString();
                    nodesPanelElement.appendChild(nodeElement);
                }
                // Draw top-middle line to parent, unless node's parent is the ROOT node.
                if (node.parent !== null) {
                    if (!(node.item.parentId === 0 && node.parent.children.length === 1)) {
                        var lineToParent = org_helper_1.createSvgLine(nodeTopMiddlePoint.x, nodeTopMiddlePoint.y, nodeTopMiddlePoint.x, nodeTopMiddlePoint.y - (_this.NODE_MARGIN_Y / 2), 'edge');
                        edgesPanelElement.appendChild(lineToParent);
                    }
                }
                // Draw line to child or children, unless node is the ROOT.
                if (!node.isLeaf()) {
                    if (node.item.id !== 0) {
                        var lineToChildOrChildren = org_helper_1.createSvgLine(nodeBottomMiddlePoint.x, nodeBottomMiddlePoint.y, nodeBottomMiddlePoint.x, nodeBottomMiddlePoint.y + (_this.NODE_MARGIN_Y / 2), 'edge');
                        edgesPanelElement.appendChild(lineToChildOrChildren);
                    }
                    // Draw line across the top of children, from the left-most child to the right-most child.
                    if (!node.collapsed && node.children.length > 1) {
                        var leftMostChildPoint = new org_models_1.Point(_this.NODE_MARGIN_X + (node.getLeftMostChild().x * (_this.NODE_WIDTH + _this.NODE_MARGIN_X)) + (_this.NODE_WIDTH / 2), nodeBottomMiddlePoint.y + (_this.NODE_MARGIN_Y / 2));
                        var rightMostChildPoint = new org_models_1.Point(_this.NODE_MARGIN_X + (node.getRightMostChild().x * (_this.NODE_WIDTH + _this.NODE_MARGIN_X)) + (_this.NODE_WIDTH / 2), nodeBottomMiddlePoint.y + (_this.NODE_MARGIN_Y / 2));
                        var lineAcrossTopOfChildren = org_helper_1.createSvgLine(leftMostChildPoint.x, leftMostChildPoint.y, rightMostChildPoint.x, rightMostChildPoint.y, 'edge');
                        edgesPanelElement.appendChild(lineAcrossTopOfChildren);
                    }
                }
                // Recursively call this function to draw all node's sibling and descendant nodes.
                node.children.forEach(function (child) {
                    _this.drawNode(child, nodesPanelElement, edgesPanelElement);
                });
            };
            this.drawNoData = function (nodesPanelElement, edgesPanelElement) {
                nodesPanelElement.style.height = 'auto';
                nodesPanelElement.style.width = 'auto';
                edgesPanelElement.style.height = 'auto';
                edgesPanelElement.style.width = 'auto';
                nodesPanelElement.insertAdjacentHTML('beforeend', '<p style="padding-left: .4em; padding-top: .2em; font-size: 1.8em; color: black;">No data.</p>');
            };
            this.nodeChildCountClickEventHandler = function (parentNodeElement) {
                // Use the nodeChildCountElement's parent as the root node for the tree.
                var nodeId = parseInt(parentNodeElement.dataset.itemId);
                // Toggle the clicked node's collapsed property in the root node. 
                _this.toggleNodeCollapsedProperty(_this._rootNode, nodeId);
                // Reset and render the tree.
                _this.render(null, true, 0);
            };
            this.toggleNodeCollapsedProperty = function (node, nodeId) {
                if (node.item.id === nodeId) {
                    node.collapsed = !node.collapsed;
                    return;
                }
                else {
                    node.children.forEach(function (child) {
                        _this.toggleNodeCollapsedProperty(child, nodeId);
                    });
                }
            };
            this.nodeClickEventHandler = function (nodeElement) {
                // Use the clicked nodeElement as the root node for the tree.
                var rootId = parseInt(nodeElement.dataset.itemId);
                _this.render(rootId, false, 0);
            };
            this.addHtmlEventHandlers = function () {
                // Add child-count click event hander to toggle a node's collapsed state.
                var childCountElements = document.querySelectorAll('.child-count');
                [].forEach.call(childCountElements, function (childCount) {
                    childCount.addEventListener('click', function (e) {
                        e.stopPropagation();
                        var target = e.target;
                        var node = target.parentElement.parentElement;
                        _this.nodeChildCountClickEventHandler(node);
                    });
                });
                // Add node click event hander to make the clicked node the chart's root node.
                var nodes = document.querySelectorAll('.node');
                [].forEach.call(nodes, function (node) {
                    node.addEventListener('click', function (e) {
                        var target = e.target;
                        var node;
                        if (target.classList.contains('node__content__link') || target.classList.contains('node__content__title')) {
                            node = target.parentElement.parentElement;
                        }
                        else if (target.classList.contains('node__content')) {
                            node = target.parentElement;
                        }
                        else {
                            node = target;
                        }
                        _this.nodeClickEventHandler(node);
                    });
                });
            };
            this._baseElement = baseElement;
            this._nodesPanelElement = nodesPanelElement;
            this._edgesPanelElement = edgesPanelElement;
            this.dataChangedEvent = new myevent_1.MyEvent();
            this.renderedEvent = new myevent_1.MyEvent();
            this.profileClickedEvent = new myevent_1.MyEvent();
            console.log('OrgChart constructed.');
        }
        Object.defineProperty(OrgChart.prototype, "rootNode", {
            get: function () {
                return this._rootNode;
            },
            enumerable: true,
            configurable: true
        });
        OrgChart.prototype.setData = function (baseData) {
            if (baseData == null) {
                baseData = [];
            }
            this._baseData = baseData;
            this._rootNode = this.createTreeNodeModelFromTreeData(this._baseData);
            this.dataChangedEvent.notifyListeners(this, { data: this._baseData });
            console.log('OrgChart.setData executed.');
        };
        OrgChart.prototype.render = function (newRootId, persistCollapsedState, maxDepth) {
            if (newRootId === void 0) { newRootId = null; }
            if (persistCollapsedState === void 0) { persistCollapsedState = false; }
            if (maxDepth === void 0) { maxDepth = -1; }
            this.clearRenderedNodesAndEdges();
            // If root node is null, draw "No data," notify listeners render was called, then exit.
            if (this._rootNode.item == null) {
                this.drawNoData(this._nodesPanelElement, this._edgesPanelElement);
                this.renderedEvent.notifyListeners(this, { rootNode: this._rootNode });
                return;
            }
            if (newRootId != null) {
                this._rootNode = this.createTreeNodeModelFromTreeData(this._baseData, newRootId);
            }
            this.initializeNodes(this._rootNode, 0, persistCollapsedState, maxDepth);
            // Was "calculateNodePositions"
            this.calculateInitialX(this._rootNode);
            this.checkAllChildrenOnScreen(this._rootNode);
            this.centerMiddleLeafNodes(this._rootNode);
            this.calculateFinalPositions(this._rootNode, 0);
            this.calculatePanelControlSize(this._rootNode, this._nodesPanelElement);
            if (this.rootNodeIsRoot()) {
                this.NODE_Y_OFFSET = -1.2;
            }
            else {
                this.NODE_Y_OFFSET = -.2;
            }
            this._edgesPanelElement.style.width = this._nodesPanelElement.scrollWidth + 'px';
            this._edgesPanelElement.style.height = this._nodesPanelElement.scrollHeight + 'px';
            this.drawNode(this._rootNode, this._nodesPanelElement, this._edgesPanelElement);
            this.addHtmlEventHandlers();
            if (!persistCollapsedState) {
                this.centerHorizontalScrollTreePanelOnNode(this._rootNode.item.id);
            }
            this.renderedEvent.notifyListeners(this, { rootNode: this._rootNode });
        };
        return OrgChart;
    }());
    exports.OrgChart = OrgChart;
    var OrgBreadcrumb = /** @class */ (function () {
        function OrgBreadcrumb(baseElement, baseOrgChart) {
            var _this = this;
            this.render = function (dataItem) {
                _this.clearBaseElement();
                if (dataItem.item == null) {
                    return;
                }
                var parentDataItems = _this.getParentTreeDataItems(dataItem, true);
                var createBreadCrumbHtml = function (node) {
                    var nodeId = 'breadcrumb-' + node.id;
                    var bcHtml = '<a class="org-breadcrumb__item" id="' + nodeId + '">' + node.name + '</a>';
                    return bcHtml;
                };
                var breadcrumbHtml = '';
                if ((parentDataItems == null || parentDataItems.length === 0) && dataItem == null) {
                    // Assign "empty" breadcrumb html, since there are no parent data items (and dataItem is null, indicating the root dataItem, e.g. Dale Hoyer, wasn't selected).
                    breadcrumbHtml = '<div class="org-breadcrumb"></div>';
                }
                else {
                    // Include the current drilled data item in the result.
                    parentDataItems.push(dataItem.item);
                    // Generate breadcrumb html from the parent data items.
                    breadcrumbHtml = '<div class="org-breadcrumb"><div class="org-breadcrumb__content">' + parentDataItems.map(function (parentNode) { return createBreadCrumbHtml(parentNode); }).join('<span class="org-breadcrumb__item-delimiter">→</span>') + '</div></div>';
                }
                _this._baseElement.innerHTML = breadcrumbHtml;
                _this.addHtmlEventHandlers();
            };
            this.clearBaseElement = function () {
                _this._baseElement.innerHTML = '';
            };
            this.getParentTreeDataItems = function (dataItem, reverseData) {
                if (dataItem == null) {
                    return [];
                }
                var parentDataItems = [];
                var parentDataItem = _this._baseData.filter(function (n) { return n.id === dataItem.item.parentId; })[0];
                while (parentDataItem != null) {
                    parentDataItems.push(parentDataItem);
                    parentDataItem = _this._baseData.filter(function (n) { return n.id === parentDataItem.parentId; })[0];
                }
                return reverseData ? parentDataItems.reverse() : parentDataItems;
            };
            this.addHtmlEventHandlers = function () {
                var self = _this;
                /* Add breadcrumb click event handler, which renders its base org chart, passing the clicked node id as the new root node. */
                var breadcrumbItems = document.querySelectorAll('.org-breadcrumb__item');
                [].forEach.call(breadcrumbItems, function (item) {
                    item.addEventListener('click', function (e) {
                        var nodeIdParts = e.target.id.split('-');
                        nodeIdParts.shift();
                        var breadcrumbNodeId = parseInt(nodeIdParts[0]);
                        self._baseOrgChart.render(breadcrumbNodeId, false, 0);
                    });
                });
            };
            this._baseElement = baseElement;
            this._baseOrgChart = baseOrgChart;
        }
        OrgBreadcrumb.prototype.setData = function (baseData) {
            if (baseData == null) {
                baseData = [];
            }
            this._baseData = baseData;
        };
        return OrgBreadcrumb;
    }());
    exports.OrgBreadcrumb = OrgBreadcrumb;
    /**
     * Maps a generic data array as a TreeData array.
     *
     * @param data - An array of objects having id, parent, and label properties.
     *
     * @returns A TreeData array.
     *
     */
    exports.getTreeData = function (data) {
        var treeDataItems = [];
        data.forEach(function (item) {
            treeDataItems.push(new org_models_1.TreeData(item.id, item.parentId, item.name, item.title));
        });
        return treeDataItems;
    };
});
//# sourceMappingURL=org.chart.js.map