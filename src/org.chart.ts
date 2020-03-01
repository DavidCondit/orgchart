import { Point, TreeData, TreeNodeModel, NodeContour } from './org.models';
import { sampleData} from './org.data';
import { clone, createSvgLine } from './org.helper';
import { MyEvent } from './myevent';

export class OrgChart {
    private _baseElement: HTMLElement;
    private _nodesPanelElement: HTMLDivElement;
    private _edgesPanelElement: HTMLDivElement;

    private _baseData: TreeData[];
    private _rootNode: TreeNodeModel;
    
    readonly NODE_SIZE: number = 1;
    readonly SIBLING_DISTANCE: number = 0;
    readonly TREE_DISTANCE: number = 0;
    private NODE_Y_OFFSET: number = -1.2;


    readonly NODE_MARGIN_X: number = 8;
    readonly NODE_MARGIN_Y: number = 60;

    NODE_HEIGHT: number = 55;
    NODE_WIDTH: number = 165;

    get rootNode(): TreeNodeModel {
        return this._rootNode;
    }

    public dataChangedEvent: MyEvent;
    public renderedEvent: MyEvent;
    public profileClickedEvent: MyEvent;

    constructor(baseElement: HTMLElement, nodesPanelElement: HTMLDivElement, edgesPanelElement: HTMLDivElement) {
        this._baseElement = baseElement;
        this._nodesPanelElement = nodesPanelElement;
        this._edgesPanelElement = edgesPanelElement;

        this.dataChangedEvent = new MyEvent();
        this.renderedEvent = new MyEvent();
        this.profileClickedEvent = new MyEvent();
        
        console.log('OrgChart constructed.');
    }    

    public setData(baseData: TreeData[]) {
        if (baseData == null) {
            baseData = [];
        }
        this._baseData = baseData;
        this._rootNode = this.createTreeNodeModelFromTreeData(this._baseData);
        this.dataChangedEvent.notifyListeners(this, { data: this._baseData});
        console.log('OrgChart.setData executed.');
    }

    public render(newRootId: number = null, persistCollapsedState: boolean = false, maxDepth: number = -1) {
                
        this.clearRenderedNodesAndEdges();

        // If root node is null, draw "No data," notify listeners render was called, then exit.
        if (this._rootNode.item == null) {            
            this.drawNoData(this._nodesPanelElement, this._edgesPanelElement);

            this.renderedEvent.notifyListeners(this, { rootNode: this._rootNode});
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
        } else {
            this.NODE_Y_OFFSET = -.2;
        }

        this._edgesPanelElement.style.width = this._nodesPanelElement.scrollWidth + 'px';
        this._edgesPanelElement.style.height = this._nodesPanelElement.scrollHeight + 'px';
        this.drawNode(this._rootNode, this._nodesPanelElement, this._edgesPanelElement);

        this.addHtmlEventHandlers();

        if (!persistCollapsedState) {
            this.centerHorizontalScrollTreePanelOnNode(this._rootNode.item.id);            
        }

        this.renderedEvent.notifyListeners(this, { rootNode: this._rootNode});
    }
    
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
    private createTreeNodeModelFromTreeData = (data: TreeData[], rootId: number = 0): TreeNodeModel => {
        let root = data.filter(r => { return r.id === rootId })[0];
        let rootTreeNode = new TreeNodeModel(root, null);
    
        // Add tree node children recursively.
        rootTreeNode.children = this.getChildNodes(data, rootTreeNode);
    
        // Sort tree children and descendent children recursively by "Label" 
        // property in ascending order.
        const sortData = (data: TreeNodeModel) => {                
            data.children.sort((a, b) => {
                if (a.item.name < b.item.name) {
                    return -1;
                } else {
                    return 1;
                };
            });
            for (let i = 0; i < data.children.length; i++) {
                const child = data.children[i];
                if (child.children.length > 0) {
                    sortData(child);
                }
            }
        };
    
        sortData(rootTreeNode);
    
        return rootTreeNode;
    }

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
    private getChildNodes = (data: TreeData[], parent: TreeNodeModel): TreeNodeModel[] => {
        let nodes: TreeNodeModel[] = [];
        let childItems = data.filter(item => { return item.parentId === parent.item.id; });
        childItems.forEach(item => {
            let treeNode: TreeNodeModel = new TreeNodeModel(item, parent);
            treeNode.children = this.getChildNodes(data, treeNode);
            nodes.push(treeNode);
        });

        return nodes;
    }   
    
    /**
     * Determines whether _rootNode is "ROOT," ie the top-most TreeData item of all chart data.
     * 
     * @returns Boolean determine whether _rootNode is ROOT.
     *
     */      
    private rootNodeIsRoot = (): boolean => {
        return this._rootNode.item == null ? false : this._rootNode.item.id === 0;
    }    
        
    private clearRenderedNodesAndEdges = () => {
        // Clear the existing tree nodes and edges.
        this._nodesPanelElement.innerHTML = '';
        this._edgesPanelElement.innerHTML = '';

        // IE requires SVG items to be cleared this way: Get the SVG container's parent element and then replace its child 
        // (SVG container) with a shallow-clone of its child (ie SVG container less its own child elements, like lines).
        this._edgesPanelElement.parentNode.replaceChild(this._edgesPanelElement.cloneNode(false), this._edgesPanelElement);

        // Since the SVG container element was replaced, get a reference to the replacement element. 
        this._edgesPanelElement = document.getElementById('tree-edges') as HTMLDivElement;
    }
    
    private centerHorizontalScrollTreePanelOnNode = (nodeId: number) => {
        // Scroll to the node element, less half of the org chart "tree" client-width (visible-width).     
        let rootNode = document.querySelector(`[data-item-id="${nodeId}"]`) as HTMLElement;
        if (rootNode == null) {
            return;
        }
        const nodeLeftX = parseInt(rootNode.style.left);
        const scrollLeftX = nodeLeftX - (this._baseElement.clientWidth / 2);
        this._baseElement.scrollTop = 0;
        this._baseElement.scrollLeft = scrollLeftX;
    }
    
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
    private initializeNodes = (node: TreeNodeModel, depth: number, persistCollapsedState: boolean = false, maxDepth: number = -1) => {
        node.x = -1;
        node.y = depth;
        node.mod = 0;
        if (!persistCollapsedState) {
            if (this.rootNodeIsRoot()) {
                node.collapsed = maxDepth === -1 ? false : depth > maxDepth;            
            } else {
                node.collapsed = maxDepth === -1 ? false : depth >= maxDepth;
            }
        }
    
        node.children.forEach(child => {
            this.initializeNodes(child, depth + 1, persistCollapsedState, maxDepth);
        });
    }
    
    
    private minContourKeyValue = (contour: NodeContour) => {
        let minValue: number;
        for (const key in contour) {
            if (parseInt(key) < minValue || minValue === undefined) {
                minValue = parseInt(key);
            }
        }
        return minValue;
    }
    
    private maxContourKeyValue = (contour: NodeContour) => {
        let maxValue: number;
        for (const key in contour) {
            if (parseInt(key) > maxValue || maxValue === undefined) {
                maxValue = parseInt(key);
            }
        }
        return maxValue;
    }
    
    private maxChildNodeWidth = (node: TreeNodeModel) => {
        let maxWidth: number;
        node.children.forEach(child => {
            if (child.width > maxWidth || maxWidth === undefined) {
                maxWidth = child.width;
            }
        });
    
        return maxWidth;
    }
    
    private maxChildNodeHeight = (node: TreeNodeModel) => {
        let maxHeight: number;
        node.children.forEach(child => {
            if (child.height > maxHeight || maxHeight === undefined) {
                maxHeight = child.height;
            }
        });
    
        return maxHeight;
    }
    
    private checkForTreeConflicts = (node: TreeNodeModel): void => {
        /*
        Compares the node's left-edge ALL of its sibling's right-edges, from it's left-most-sibling inward,
        to determine if any of its left-sibling's right-edges intersect this node's left-edge. The largest intersection
        value is used to determine how much this node needs to shift to the right so that it's left-edge doesn't intersect
        with any of its left siblings' right-edges. 
        */
        const minimumDistanceBetweenTrees: number = this.TREE_DISTANCE + this.NODE_SIZE;
    
        var leftSibling = node.getLeftMostSibling();
        
        if (leftSibling === null) {
            return;
        }
        
        let shortestDistanceBetweenTreeContours: number = minimumDistanceBetweenTrees;
    
        while (leftSibling !== null && leftSibling.item.id !== node.item.id)
        {
            let leftContour = this.getLeftContour(node, 0, new NodeContour());
            let rightContour = this.getRightContour(leftSibling, 0, new NodeContour());
    
            for (let yLevel: number = this.minContourKeyValue(leftContour); yLevel <= Math.min(this.maxContourKeyValue(leftContour), this.maxContourKeyValue(rightContour)); yLevel++)
            {
                if ((leftContour[yLevel] - rightContour[yLevel]) < shortestDistanceBetweenTreeContours)
                {
                    shortestDistanceBetweenTreeContours = leftContour[yLevel] - rightContour[yLevel];
                }                    
            }
    
            // Iterate to the right.
            leftSibling = leftSibling.getNextSibling();
        }
    
        if (shortestDistanceBetweenTreeContours < minimumDistanceBetweenTrees)
        {
            let shiftValue: number = minimumDistanceBetweenTrees - shortestDistanceBetweenTreeContours;
            node.x += shiftValue;
            node.mod += shiftValue;        
        }
    }
    
    private getLeftContour = (node: TreeNodeModel, modSum: number, values: NodeContour) => {
        if (values[node.y] === undefined) {
            values[node.y] = node.x + modSum;
        } else {
            values[node.y] = Math.min(values[node.y], node.x + modSum);
        }
    
        if (!node.collapsed) {
            modSum += node.mod;
    
            node.children.forEach(child => {
                values = this.getLeftContour(child, modSum, values);
            });            
        }
    
        return values;
    }
    
    private getRightContour = (node: TreeNodeModel, modSum: number, values: NodeContour) => {   
        if (values[node.y] === undefined) {
            values[node.y] = node.x + modSum;
        } else {
            values[node.y] = Math.max(values[node.y], node.x + modSum);
        }
    
        if (!node.collapsed) {
            modSum += node.mod;
    
            node.children.forEach(child => {
                values = this.getRightContour(child, modSum, values);
            });            
        }
    
        return values;
    }
    
    private calculateInitialX = (node: TreeNodeModel) => {
        // Do a post-order traversal (ie iterate nodes from the bottom-left to the top-right).
        node.children.forEach(child => {
            this.calculateInitialX(child);
        });
    
        if (node.isLeaf()) {
            if (!node.isLeftMost()) {
                // node doesn't have children and isn't the left-most of its siblings (ie NOT the first child of its parent node),
                // so set its x equal to it's left sibling + NODE_SIZE + SIBLING_DISTANCE.
                node.x = node.getPreviousSibling().x + this.NODE_SIZE + this.SIBLING_DISTANCE;
            } else {
                // node is the left-most of its siblings, if it even has siblings. Set its x equal to 0.
                node.x = 0;
            }
        } else if (node.getChildCount() === 1) {
            if (node.isLeftMost()) {
                // node has 1 child node and node is the left-most of its siblings, if it even has siblings.
                // Set node's x equal to its only child's x to position it directly above its child.
                node.x = node.getLeftMostChild().x;
            } else {
                // node has 1 child node, but it isn't the left-most of its siblings. 
                // Set node's x equal to its left-sibling + NODE_SIZE + SIBLING_DISTANCE.
                node.x = node.getPreviousSibling().x + this.NODE_SIZE + this.SIBLING_DISTANCE;
                // node's x is positioned to the right of its left-sibling, so its single-child node needs to be
                // shifted underneath its parent. Set node's mod equal to the distance the single-child node needs
                // to shift to be underneath node. Later, we'll use each parent node's mod value to update its child nodes'
                // x values, so they'll all shift underneath their parents.         
                node.mod = node.x - node.getLeftMostChild().x;
            }
        } else {
            // node has more than one child nodes, so get the midpoint difference of its left-most child node and its
            // right-most child node.
            let childrenNodesMidpointX = (node.getLeftMostChild().x + node.getRightMostChild().x) / 2;
            
            if (node.isLeftMost()) {
                // node is the left-most of its siblings, if it even has siblings.
                // Set node's x equal to its children's midpoint value to position it directly above its children.
                node.x = childrenNodesMidpointX;
            } else {
                // node isn't the left-most of its siblings, so set its x equal to its left-sibling's x + NODE_SIZE + SIBLING_DISTANCE.
                node.x = node.getPreviousSibling().x + this.NODE_SIZE + this.SIBLING_DISTANCE;
                // node's x is positioned to the right of its left-sibling, so its child nodes need to be
                // shifted underneath their parent. Set node's mod equal to the distance the children nodes needs
                // to shift to be underneath node. Later, we'll use each parent node's mod value to update its child nodes'
                // x values, so the'll all shift underneath their parents.                 
                node.mod = node.x - childrenNodesMidpointX;
            }
        }
    
        if (!node.isLeaf() && !node.isLeftMost()) {
            this.checkForTreeConflicts(node);
        }   
    }
    
    private checkAllChildrenOnScreen = (rootNode: TreeNodeModel) => {
        /* 
            Get rootNode's left-contour. If any of its left-contour's x values are less than 0,
            set shiftValue equal to the negative x value as the inverse positive x value.
        */
        let leftContour = this.getLeftContour(rootNode, 0, new NodeContour());
        let shiftAmount = 0;
        for (const y in leftContour) {
            if(leftContour[y] + shiftAmount < 0) {
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
    }
    
    private centerMiddleLeafNodes = (node: TreeNodeModel) => {
        /* 
        This method iterate's node's children, right-to-left. If the iterated child is a leaf and is positioned somewhere 
        in the middle (between it's parent's left-most and right-most child nodes), the iterated child is positioned between
        it's immediate left and right siblings. If the iterated child has children, it isn't centered but this method is called
        recursively for the child's children, as the child's children might have middle positioned leaf nodes that need to be centered,
        so on and so forth.
        */
        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = node.children[i];
            if (child.isLeaf() && !child.isLeftMost() && !child.isRightMost()) {
                let leftSiblingX = child.getPreviousSibling().x;
                let rightSiblingX = child.getNextSibling().x;
                let centerValue = (rightSiblingX + leftSiblingX) / 2;
                child.x = centerValue;
            }
            if (!child.isLeaf()) {
                this.centerMiddleLeafNodes(child);
            }            
        }
    }
    
    private calculateFinalPositions = (node: TreeNodeModel, modSum: number) => {
        node.x += modSum;
        modSum += node.mod;
    
        // Post-order traversal.
        node.children.forEach(child => {
            this.calculateFinalPositions(child, modSum);
        });
    
        if (node.isLeaf()) {
            node.width = node.x;
            node.height = node.y;
        } else {
            node.width = this.maxChildNodeWidth(node);
            node.height = this.maxChildNodeHeight(node);
        }
    }
    
    private calculatePanelControlSize = (rootNode: TreeNodeModel, panel: HTMLDivElement) => {
        let treeWidth = rootNode.width + 1;
        let treeHeight = rootNode.height + 1;

        if (this.rootNodeIsRoot()) {
            treeHeight--;
        }
    
        // Width is the (# of nodes wide * NODE_WIDTH) + ((# of nodes wide + 1) * NODE_MARGIN_X).
        let panelWidth = (treeWidth * this.NODE_WIDTH) + ((treeWidth + 1) * this.NODE_MARGIN_X);
    
        // Height is the (# of nodes tall * NODE_HEIGHT) + ((# of nodes tall + 1) * NODE_MARGIN_Y).
        let panelHeight = (treeHeight * this.NODE_HEIGHT) + ((treeHeight + 1) * this.NODE_MARGIN_Y);    
    
        panel.style.width = panelWidth + 'px';
        panel.style.height = panelHeight + 'px';
    }
    
    private drawNode = (node: TreeNodeModel, nodesPanelElement: HTMLElement, edgesPanelElement: HTMLElement) => {

        if (node.parent && node.parent.collapsed) {
            return;
        }

        // Calculate node's x coordinate in pixels.
        const x = (this.NODE_MARGIN_X + (node.x * (this.NODE_WIDTH + this.NODE_MARGIN_X)));
        // Calculate node's y coordinate in pixels.
        const y = (this.NODE_MARGIN_Y + ((node.y + this.NODE_Y_OFFSET) * (this.NODE_HEIGHT + this.NODE_MARGIN_Y)));
        // Calculate node's top-middle and bottom-middle points.
        const nodeTopMiddlePoint = new Point(x + (this.NODE_WIDTH / 2), y);
        const nodeBottomMiddlePoint = new Point(nodeTopMiddlePoint.x, y + this.NODE_HEIGHT);

        // Draw the node, unless the node is the ROOT.
        if (node.item.id !== 0) {
            let nodeElement = document.createElement('div');
            nodeElement.classList.add('node');
            nodeElement.style.width = this.NODE_WIDTH + 'px';
            nodeElement.style.height = this.NODE_HEIGHT + 'px';
            nodeElement.style.left = x + 'px';
            nodeElement.style.top = y + 'px';

            nodeElement.dataset.itemId = node.item.id.toString();

            let nodeContent = document.createElement('div');
            nodeContent.classList.add('node__content');

            let nodeLink = document.createElement('a');
            nodeLink.classList.add('node__content__link');
            nodeLink.innerHTML = node.item.name;

            let nodeTitle = document.createElement('div');
            nodeTitle.classList.add('node__content__title');
            nodeTitle.innerHTML = node.item.title;

            nodeContent.appendChild(nodeLink);
            nodeContent.appendChild(nodeTitle);

            const childCount = node.getChildCount();
            if (childCount > 0) {
                let childCountElement = document.createElement('span');
                childCountElement.classList.add('child-count');
                childCountElement.innerHTML = `${childCount}`;
                nodeContent.appendChild(childCountElement);
            }

            nodeElement.appendChild(nodeContent);

            nodesPanelElement.appendChild(nodeElement);
        } else {
            // Draw ROOT as a hidden element so the chart can be center-scrolled on it by other code.
            let nodeElement = document.createElement('div');
            nodeElement.classList.add('node');
            nodeElement.style.width = this.NODE_WIDTH + 'px';
            nodeElement.style.height = this.NODE_HEIGHT + 'px';
            nodeElement.style.left = x + 'px';
            nodeElement.style.top = y + 'px';
            nodeElement.style.display = 'none';

            nodeElement.dataset.itemId = node.item.id.toString();

            nodesPanelElement.appendChild(nodeElement);
        }

        // Draw top-middle line to parent, unless node's parent is the ROOT node.
        if (node.parent !== null) {
            if (!(node.item.parentId === 0 && node.parent.children.length === 1)) {
                let lineToParent = createSvgLine(nodeTopMiddlePoint.x, nodeTopMiddlePoint.y, nodeTopMiddlePoint.x, nodeTopMiddlePoint.y - (this.NODE_MARGIN_Y / 2), 'edge');
                edgesPanelElement.appendChild(lineToParent);
            }
        }

        // Draw line to child or children, unless node is the ROOT.
        if (!node.isLeaf()) {
            if (node.item.id !== 0) {
                let lineToChildOrChildren = createSvgLine(nodeBottomMiddlePoint.x, nodeBottomMiddlePoint.y, nodeBottomMiddlePoint.x, nodeBottomMiddlePoint.y + (this.NODE_MARGIN_Y / 2), 'edge');                
                edgesPanelElement.appendChild(lineToChildOrChildren);
            }

            // Draw line across the top of children, from the left-most child to the right-most child.
            if (!node.collapsed && node.children.length > 1) {
                let leftMostChildPoint =
                    new Point(
                        this.NODE_MARGIN_X + (node.getLeftMostChild().x * (this.NODE_WIDTH + this.NODE_MARGIN_X)) + (this.NODE_WIDTH / 2),
                        nodeBottomMiddlePoint.y + (this.NODE_MARGIN_Y / 2)
                    );
                let rightMostChildPoint =
                    new Point(
                        this.NODE_MARGIN_X + (node.getRightMostChild().x * (this.NODE_WIDTH + this.NODE_MARGIN_X)) + (this.NODE_WIDTH / 2),
                        nodeBottomMiddlePoint.y + (this.NODE_MARGIN_Y / 2)
                    );
                let lineAcrossTopOfChildren = createSvgLine(leftMostChildPoint.x, leftMostChildPoint.y, rightMostChildPoint.x, rightMostChildPoint.y, 'edge');
                edgesPanelElement.appendChild(lineAcrossTopOfChildren);
            }
        }

        // Recursively call this function to draw all node's sibling and descendant nodes.
        node.children.forEach(child => {
            this.drawNode(child, nodesPanelElement, edgesPanelElement);
        });
    }
    
    private drawNoData = (nodesPanelElement: HTMLElement, edgesPanelElement: HTMLElement) => {
        nodesPanelElement.style.height = 'auto';
        nodesPanelElement.style.width = 'auto';
        edgesPanelElement.style.height = 'auto';
        edgesPanelElement.style.width = 'auto';
        nodesPanelElement.insertAdjacentHTML('beforeend','<p style="padding-left: .4em; padding-top: .2em; font-size: 1.8em; color: black;">No data.</p>');
    }

    private nodeChildCountClickEventHandler = (parentNodeElement: HTMLElement) => {
        // Use the nodeChildCountElement's parent as the root node for the tree.
        let nodeId = parseInt(parentNodeElement.dataset.itemId);
    
        // Toggle the clicked node's collapsed property in the root node. 
        this.toggleNodeCollapsedProperty(this._rootNode, nodeId);
    
        // Reset and render the tree.
        this.render(null, true, 0);
    }

    private toggleNodeCollapsedProperty = (node: TreeNodeModel, nodeId: number) => {
        if (node.item.id === nodeId) {
            node.collapsed = !node.collapsed;
            return;
        } else {
            node.children.forEach(child => {
                this.toggleNodeCollapsedProperty(child, nodeId);
            });
        }
    }    

    private nodeClickEventHandler = (nodeElement: HTMLElement) => {
        // Use the clicked nodeElement as the root node for the tree.
        let rootId = parseInt(nodeElement.dataset.itemId);                 
        this.render(rootId, false, 0);    
    }

    private addHtmlEventHandlers = (): void => {
        // Add child-count click event hander to toggle a node's collapsed state.
        let childCountElements = document.querySelectorAll('.child-count');
        [].forEach.call(childCountElements, childCount => {
            childCount.addEventListener('click', (e) => {
                    e.stopPropagation();            
                    const target = e.target as HTMLElement;
                    const node: HTMLElement = target.parentElement.parentElement;
                    this.nodeChildCountClickEventHandler(node);
                });
            });

        // Add node click event hander to make the clicked node the chart's root node.
        let nodes = document.querySelectorAll('.node');
        [].forEach.call(nodes, node => {
            node.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    let node: HTMLElement;
                    if (target.classList.contains('node__content__link') || target.classList.contains('node__content__title')) {
                        node = target.parentElement.parentElement;
                    } else if (target.classList.contains('node__content')) {
                        node = target.parentElement;
                    } else {
                        node = target;
                    }
                            
                    this.nodeClickEventHandler(node);
                });
            });            
    }
}

export class OrgBreadcrumb {
    private _baseData: TreeData[];
    private _baseElement: HTMLElement;
    private _baseOrgChart: OrgChart;

    constructor (baseElement: HTMLElement, baseOrgChart: OrgChart) {
        this._baseElement = baseElement;
        this._baseOrgChart = baseOrgChart;
    }

    public setData(baseData: TreeData[]) {
        if (baseData == null) {
            baseData = [];
        }
        this._baseData = baseData;
    }

    public render = (dataItem: TreeNodeModel) => {
        this.clearBaseElement();
    
        if (dataItem.item == null) {
            return;
        }

        let parentDataItems: TreeData[] = this.getParentTreeDataItems(dataItem, true);
        
        const createBreadCrumbHtml = (node: TreeData) => {
            let nodeId: string = 'breadcrumb-' + node.id;
            let bcHtml: string = '<a class="org-breadcrumb__item" id="' + nodeId + '">' + node.name + '</a>';
            return bcHtml;
        }
    
        let breadcrumbHtml: string = '';
        if ((parentDataItems == null || parentDataItems.length === 0) && dataItem == null) {    
            // Assign "empty" breadcrumb html, since there are no parent data items (and dataItem is null, indicating the root dataItem, e.g. Dale Hoyer, wasn't selected).
            breadcrumbHtml = '<div class="org-breadcrumb"></div>';
        } else {
    
            // Include the current drilled data item in the result.
            parentDataItems.push(dataItem.item);
    
            // Generate breadcrumb html from the parent data items.
            breadcrumbHtml = '<div class="org-breadcrumb"><div class="org-breadcrumb__content">' + parentDataItems.map(function (parentNode) { return createBreadCrumbHtml(parentNode); }).join('<span class="org-breadcrumb__item-delimiter">→</span>') + '</div></div>';
        }
        
        this._baseElement.innerHTML = breadcrumbHtml;

        this.addHtmlEventHandlers();
    }    

    private clearBaseElement = (): void => {
        this._baseElement.innerHTML = '';
    }

    private getParentTreeDataItems = (dataItem: TreeNodeModel, reverseData: boolean): TreeData[] => {    
        if (dataItem == null) {
            return [];
        }  
    
        let parentDataItems = [];
        let parentDataItem = this._baseData.filter(n => { return n.id === dataItem.item.parentId; })[0];
    
        while (parentDataItem != null) {
            parentDataItems.push(parentDataItem);
            parentDataItem = this._baseData.filter(n => { return n.id === parentDataItem.parentId; })[0];
        }
        return reverseData ? parentDataItems.reverse() : parentDataItems;
    }

    private addHtmlEventHandlers = (): void => {
        let self = this;

        /* Add breadcrumb click event handler, which renders its base org chart, passing the clicked node id as the new root node. */
        let breadcrumbItems = document.querySelectorAll('.org-breadcrumb__item');
        [].forEach.call(breadcrumbItems, function (item) {
            item.addEventListener('click', function (e) {
                let nodeIdParts = e.target.id.split('-');
                nodeIdParts.shift();
                let breadcrumbNodeId = parseInt(nodeIdParts[0]);
                self._baseOrgChart.render(breadcrumbNodeId, false, 0);
            });
        });
    }
}

/**
 * Maps a generic data array as a TreeData array.
 *
 * @param data - An array of objects having id, parent, and label properties.
 * 
 * @returns A TreeData array.
 *
 */    
export const getTreeData = (data: any): TreeData[] => {
    let treeDataItems: TreeData[] = [];
    data.forEach(item => {
        treeDataItems.push(new TreeData(item.id, item.parentId, item.name, item.title));
    });
    return treeDataItems;
}
