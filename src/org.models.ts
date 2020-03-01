export class Point 
{
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    x: number;
    y: number;
}

export class TreeData 
{
    constructor (id: number, parentId: number, name: string, title: string) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.title = title;
    }

    id: number;
    parentId: number;
    name: string;
    title: string;
}

export class TreeNodeModel 
{    
    constructor(data: TreeData, parent: TreeNodeModel) {
        this.item = data;
        this.parent = parent;  
    }

    item: TreeData;
    parent: TreeNodeModel;
    children: TreeNodeModel[];
    x: number;
    y: number;
    mod: number;
    width: number;
    height: number;
    collapsed: boolean;

    isLeaf(): boolean {
        return this.children.length === 0 || this.collapsed;
    }

    getChildCount(): number {
        return this.children.length;
    }

    getDescendantCount(): number {
        const countDescendants = (children: TreeNodeModel[], counter: number): number => {
            for (let i = 0; i < children.length; i++) {
                counter++;
                let item = children[i];
                if (item.getChildCount() > 0) {
                    counter = countDescendants(item.children, counter);
                }
            }
            return counter;
        }

        return countDescendants(this.children, 0);        
    }

    isLeftMost(): boolean {
        if (this.parent === null) {
            return true;
        } else {
            return this.parent.children[0] === this;
        }
    }

    isRightMost(): boolean {
        if (this.parent === null) {
            return true;
        } else {
            return this.parent.children[this.parent.children.length - 1] === this;
        }
    }

    getPreviousSibling(): TreeNodeModel {
        if (this.parent === null || this.isLeftMost()) {
            return null;
        } else {
            let index = this.parent.children.indexOf(this);
            return this.parent.children[index - 1];
        }
    }

    getNextSibling(): TreeNodeModel {
        if (this.parent === null || this.isRightMost()) {
            return null;
        } else {
            let index = this.parent.children.indexOf(this);
            return this.parent.children[index + 1];
        }
    }
    
    getLeftMostSibling(): TreeNodeModel {
        if (this.parent === null) {
            return null;
        } else if (this.isLeftMost()) {
            return this;
        } else {
            return this.parent.children[0];
        }
    }

    getLeftMostChild(): TreeNodeModel {
        if (this.children.length === 0) {
            return null;
        } else {
            return this.children[0];
        }
    }

    getRightMostChild(): TreeNodeModel {
        if (this.children.length === 0) {
            return null;
        } else {
            return this.children[this.children.length - 1];
        }
    }
    
    get toString(): string {
        return this.item.id.toString();
    }
}

interface NodeContourInterface {
    [depth: number]: number;
}

export class NodeContour implements NodeContourInterface {
    [depth: number]: number;
}
