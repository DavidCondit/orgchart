import { TreeData, TreeNodeModel } from './org.models';
import { sampleData} from './org.data';
import { OrgChart, OrgBreadcrumb, getTreeData } from './org.chart'

// Get a reference to required org chart HTML elements.
let _baseTreeElement = document.getElementById('tree');
let _nodesPanelElement = document.getElementById('tree-nodes') as HTMLDivElement;
let _edgesPanelElement = document.getElementById('tree-edges') as HTMLDivElement;

// Get a reference to the required org breadcrumb HTML element.
let _baseBreadcrumbElement = document.getElementById('org-breadcrumb')

// New up an org chart with no data.
let _orgChart = new OrgChart(_baseTreeElement, _nodesPanelElement, _edgesPanelElement);
_orgChart.setData([]);

// New up an org breadcrumb with no data.
let _orgBreadcrumb = new OrgBreadcrumb(_baseBreadcrumbElement, _orgChart);
_orgBreadcrumb.setData([]);

// Subscribe org breadcrumb to its parent org chart's rendered event, so it can re-render itself 
// when org chart re-renders.
_orgChart.renderedEvent.subscribe(window, (source, args) => {
    _orgBreadcrumb.render(_orgChart.rootNode);    
});

// Render org chart (and the listening breadcrumb) with no data.
_orgChart.render(null, false, 0);


// Get org chart data, set it for org chart and breadcrumb, then render org chart
// (and the listening breadcrumb).
let allTreeData: TreeData[] = getTreeData(sampleData);
_orgChart.setData(allTreeData);
_orgBreadcrumb.setData(allTreeData);
_orgChart.render(null, false, 0);



// Run an IIF to apply "click-and-drag-to-scroll" functionality to the org chart div.
(() => {
    // Reference the content container div.
    let main = document.getElementById('tree');
    // Reference the mouse state.
    let mouse = { mouseDown: false, clickX: null, clickY: null };

    /* Save the mouse state when the mouse is pressed in the content container div. */
    let mouseDownEventHandler = (e: MouseEvent) => {
        e.preventDefault();
        mouse.mouseDown = true;
        mouse.clickX = e.pageX;
        mouse.clickY = e.pageY;
    };

    /* Remove then add the event handler to avoid a situation where a handler is added more than once. */
    main.removeEventListener('mousedown', mouseDownEventHandler);
    main.addEventListener('mousedown', mouseDownEventHandler);


    /* Update the mouse state when the mouse button is unpressed anywhere in the page. */
    var mouseUpEventHandler = (e: MouseEvent) => {
        e.preventDefault();
        mouse.mouseDown = false;
    };

    /* Remove then add the event handler to avoid a situation where a handler is added more than once. */
    document.getElementsByTagName('html')[0].removeEventListener('mouseup', mouseUpEventHandler);
    document.getElementsByTagName('html')[0].addEventListener('mouseup', mouseUpEventHandler);


    /* When the mouse is pressed in the content container, scroll the content in the direction of the moving mouse. */
    const mouseMoveEventHandler = (e: MouseEvent) => {
        e.preventDefault();
        if (mouse.mouseDown) {
            /* Set the desired "scroll multiplier" to speed up or slow down the scroll. */
            let scrollXMultiplier = 1.6;
            let scrollYMultiplier = 1.6;

            /* Get the difference of the mouse's prior pageX position (e.g. clickX) less its current pageX position.
                The difference is multiplied by the scroll multiplier to determine the amount to increase (or decrease) the
                content container's new scrollLeft value. */
            let mouseXDelta = mouse.clickX - e.pageX;
            let scrollX = (mouseXDelta) * scrollXMultiplier;

            /* Get the difference of the mouse's prior pageY position (e.g. clickY) less its current pageY position.
                The difference is multiplied by the scroll multiplier to determine the amount to increase (or decrease) the
                content container's new scrollTop value. */
            let mouseYDelta = mouse.clickY - e.pageY;
            let scrollY = (mouseYDelta) * scrollYMultiplier;

            // console.log(`x: ${scrollX}, y: ${scrollY}`);

            /* Set the content container's scrollLeft and scrollTop properties to "scroll" the content. */
            main.scrollLeft = main.scrollLeft + scrollX;
            main.scrollTop = main.scrollTop + scrollY;

            /* Update the mouse's position state with its current pageX and pageY values. */
            mouse.clickX = e.pageX;
            mouse.clickY = e.pageY;
        }
    };

    /* Remove then add the event handler to avoid a situation where a handler is added more than once. */
    main.removeEventListener('mousemove', mouseMoveEventHandler);
    main.addEventListener('mousemove', mouseMoveEventHandler);
})();    


// Get reference to the zoom slider (range) HTML element.
const _zoomSlider: HTMLInputElement = document.getElementById('zoom-slider') as HTMLInputElement;

// Function for setting an OrgChart instance's node height and width, maintaining its node's initial aspect ratio.
const setOrgChartNodeWidthAndHeight = (orgchart: OrgChart, newHeight: number) => {        
    let aspectRatio = orgchart.NODE_WIDTH / orgchart.NODE_HEIGHT;
    let newWidth: number = newHeight * aspectRatio;
    orgchart.NODE_HEIGHT = newHeight;
    orgchart.NODE_WIDTH = newWidth;
}

// Function for adding (or replacing) a stylesheet rule to set ".node" font-size.
const setStyleSheetNodeSize = (emFontSize: number) => {
    let sheetToBeRemoved = document.getElementById('node-font-size');
    if (sheetToBeRemoved) {
        let sheetParent = sheetToBeRemoved.parentNode;
        sheetParent.removeChild(sheetToBeRemoved);    
    }

    let sheet = document.createElement('style');
    sheet.id = "node-font-size";
    sheet.innerHTML = `.node { font-size: ${emFontSize}em; }`;
    document.body.appendChild(sheet);
}

// Listen to changes in the zoom slider. Adjust the node height and width and font-size of org chart nodes.
_zoomSlider.addEventListener('change', e => {
    
    const zoomSliderValue: number = parseInt(_zoomSlider.value);
    
    switch (zoomSliderValue) {
        case 1:   
            setOrgChartNodeWidthAndHeight(_orgChart, 25);
            setStyleSheetNodeSize(.6);
            break;
        case 2:
            setOrgChartNodeWidthAndHeight(_orgChart, 30);
            setStyleSheetNodeSize(.7);
            break;
        case 3:
            setOrgChartNodeWidthAndHeight(_orgChart, 35);
            setStyleSheetNodeSize(.8);
            break;
        case 4:
            setOrgChartNodeWidthAndHeight(_orgChart, 40);
            setStyleSheetNodeSize(.9);
            break;
        case 5:
            setOrgChartNodeWidthAndHeight(_orgChart, 45);
            setStyleSheetNodeSize(1);
            break;
        case 6:
            setOrgChartNodeWidthAndHeight(_orgChart, 50);
            setStyleSheetNodeSize(1.1);
            break;
        case 7:
            setOrgChartNodeWidthAndHeight(_orgChart, 55);
            setStyleSheetNodeSize(1.2);
            break;
        case 8:
            setOrgChartNodeWidthAndHeight(_orgChart, 60);
            setStyleSheetNodeSize(1.3);
            break;
        case 9:
            setOrgChartNodeWidthAndHeight(_orgChart, 65);
            setStyleSheetNodeSize(1.4);
            break;
        case 10:
            setOrgChartNodeWidthAndHeight(_orgChart, 70);
            setStyleSheetNodeSize(1.5);
            break;
        }

    // Re-render org chart, now that its node height and width and font-size have changed.
    _orgChart.render(null, true, 0);
});


// Get a reference to the Expand All button.
const _expandAllButton = document.getElementById('expand-all-btn');

// Add a click handler.
_expandAllButton.addEventListener('click', e => {
    const expandNode = (node: TreeNodeModel) => {
        node.collapsed = false;
        node.children.forEach(child => {
            expandNode(child);
        });
    }
    expandNode(_orgChart.rootNode);
    _orgChart.render(null, false, -1);
});

// Get a reference to the Collapse All button.
const _collapseAllButton = document.getElementById('collapse-all-btn');

// Add a click handler.
_collapseAllButton.addEventListener('click', e => {
    const collapseNode = (node: TreeNodeModel) => {
        node.collapsed = true;
        node.children.forEach(child => {
            collapseNode(child);
        });
    }
    collapseNode(_orgChart.rootNode);
    _orgChart.render(null, false, 0);
});


// Expand all nodes!
_expandAllButton.click();

// Export org chart so it's available to reference as window.main.
export = _orgChart;