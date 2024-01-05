import * as d3 from "d3";
import { Modal, Notice } from "obsidian";
import VisComp from "../Components/VisComp.svelte";
import { getInNeighbours, getOutNeighbours, getSinks, } from "../Utils/graphUtils";
export function graphlibToD3(g) {
    const d3Graph = { nodes: [], links: [] };
    const nodeIDs = {};
    g.nodes().forEach((node, i) => {
        d3Graph.nodes.push({ id: i, name: node });
        nodeIDs[node] = i;
    });
    g.forEachEdge((k, a, s, t) => {
        d3Graph.links.push({
            source: nodeIDs[s],
            target: nodeIDs[t],
        });
    });
    return d3Graph;
}
export function bfsFromAllSinks(g) {
    const queue = getSinks(g);
    const adjList = [];
    let i = 0;
    while (queue.length && i < 1000) {
        i++;
        const currNode = queue.shift();
        const newNodes = getInNeighbours(g, currNode);
        if (newNodes.length) {
            newNodes.forEach((pre) => {
                const next = {
                    name: currNode,
                    parentId: pre,
                    depth: i,
                };
                queue.push(pre);
                adjList.push(next);
            });
        }
        else {
            adjList.push({
                name: currNode,
                parentId: undefined,
                depth: i,
            });
        }
    }
    const maxDepth = adjList.sort((a, b) => a.depth - b.depth).last().depth;
    adjList.forEach((item) => (item.height = maxDepth - item.depth));
    return adjList;
}
export function dfsAdjList(g, startNode) {
    const queue = [startNode];
    const adjList = [];
    let i = 0;
    while (queue.length && i < 1000) {
        i++;
        const currNode = queue.shift();
        const newNodes = getOutNeighbours(g, currNode);
        if (newNodes.length) {
            newNodes.forEach((succ) => {
                const next = {
                    name: currNode,
                    parentId: succ,
                    depth: i,
                };
                queue.push(succ);
                adjList.push(next);
            });
        }
        else {
            adjList.push({
                name: currNode,
                parentId: undefined,
                depth: i,
            });
        }
    }
    const maxDepth = adjList.sort((a, b) => a.depth - b.depth).last().depth;
    adjList.forEach((item) => (item.height = maxDepth - item.depth));
    return adjList;
}
export function bfsAdjList(g, startNode) {
    const queue = [startNode];
    const adjList = [];
    let i = 0;
    while (queue.length && i < 1000) {
        i++;
        const currNode = queue.shift();
        const neighbours = {
            succs: getOutNeighbours(g, currNode),
            pres: getInNeighbours(g, currNode),
        };
        console.log({ currNode, neighbours });
        const next = {
            name: currNode,
            pres: undefined,
            succs: undefined,
            parentId: i,
            depth: i,
        };
        if (neighbours.succs.length) {
            next.succs = neighbours.succs;
            queue.push(...neighbours.succs);
        }
        if (neighbours.pres.length) {
            next.pres = neighbours.pres;
        }
        adjList.push(next);
    }
    const maxDepth = adjList.sort((a, b) => a.depth - b.depth).last().depth;
    adjList.forEach((item) => (item.height = maxDepth - item.depth));
    return adjList;
}
export function dfsFlatAdjList(g, startNode) {
    const nodes = g.nodes();
    const nodeCount = nodes.length;
    const visits = {};
    nodes.forEach((node, i) => {
        visits[node] = nodeCount * i;
    });
    const queue = [startNode];
    const adjList = [];
    let depth = 1;
    let i = 0;
    while (queue.length && i < 1000) {
        i++;
        const currNode = queue.shift();
        const next = getOutNeighbours(g, currNode);
        if (next.length) {
            queue.unshift(...next);
            next.forEach((succ) => {
                const parentId = nodeCount * nodes.indexOf(succ);
                if (!adjList.some((adjItem) => adjItem.name === currNode && adjItem.parentId === parentId)) {
                    adjList.push({
                        id: visits[currNode],
                        name: currNode,
                        parentId,
                        depth,
                    });
                    visits[currNode]++;
                }
            });
            depth++;
        }
        else {
            adjList.push({
                id: visits[currNode],
                name: currNode,
                parentId: 999999999,
                depth,
            });
            depth = 1;
            visits[currNode]++;
        }
    }
    adjList.push({
        id: 999999999,
        name: "CONTAINER",
        parentId: undefined,
        depth: 0,
    });
    const maxDepth = adjList.sort((a, b) => a.depth - b.depth).last().depth;
    adjList.forEach((item) => (item.height = maxDepth - item.depth));
    console.log({ visits });
    return adjList;
}
export const stratify = d3
    .stratify()
    .id(function (d) {
    console.log({ d });
    return d.name;
})
    .parentId(function (d) {
    return d.parentId;
});
export class VisModal extends Modal {
    constructor(plugin) {
        super(app);
        this.plugin = plugin;
        this.modal = this;
    }
    onOpen() {
        new Notice("Alot of these features may not work, it is still very experimental.");
        const { contentEl } = this;
        contentEl.empty();
        new VisComp({
            target: contentEl,
            props: {
                modal: this,
            },
        });
    }
    onClose() {
        this.contentEl.empty();
    }
}
//# sourceMappingURL=VisModal.js.map