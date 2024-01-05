import { MultiGraph } from "graphology";
import { dfsFromNode } from "graphology-traversal";
import { info } from "loglevel";
import { BC_I_REFLEXIVE, BC_ORDER, blankRealNImplied, DIRECTIONS, } from "../constants";
import { getFieldInfo, getOppDir, getOppFields } from "./HierUtils";
import { getBaseFromMDPath } from "./ObsidianUtils";
// This function takes the real & implied graphs for a given relation, and returns a new graphs with both.
// It makes implied relations real
// TODO use reflexiveClosure instead
export function closeImpliedLinks(real, implied) {
    const closedG = real.copy();
    implied.forEachEdge((key, a, s, t) => {
        closedG.mergeEdge(t, s, a);
    });
    return closedG;
}
export function removeUnlinkedNodes(g) {
    const copy = g.copy();
    copy.forEachNode((node) => {
        if (!copy.degree(node))
            copy.dropNode(node);
    });
    return copy;
}
/**
 * Return a subgraph of all nodes & edges with `dirs.includes(a.dir)`
 *
 * Filter the given graph to only include edges in the given directions.
 * @param  {MultiGraph} g
 * @param  {Directions} dir
 */
export function getSubInDirs(g, ...dirs) {
    const sub = new MultiGraph();
    g === null || g === void 0 ? void 0 : g.forEachEdge((k, a, s, t) => {
        if (dirs.includes(a.dir)) {
            //@ts-ignore
            addNodesIfNot(sub, [s, t], { order: a.order });
            sub.addEdge(s, t, a);
        }
    });
    return sub;
}
/**
 * Return a subgraph of all nodes & edges with `fields.includes(a.field)`.
 *
 * Filter the given graph to only include edges with the given fields.
 * @param  {MultiGraph} g
 * @param  {string[]} fields
 */
export function getSubForFields(g, fields) {
    const sub = new MultiGraph();
    g.forEachEdge((k, a, s, t) => {
        if (fields.includes(a.field)) {
            //@ts-ignore
            addNodesIfNot(sub, [s, t], { order: a.order });
            sub.addEdge(s, t, a);
        }
    });
    return sub;
}
/**
 * For every edge in `g`, add the reverse of the edge to a copy of `g`.
 *
 * It also sets the attrs of the reverse edges to `oppDir` and `oppFields[0]`
 * @param  {MultiGraph} g
 * @param  {UserHier[]} userHiers
 * @param  {boolean} closeAsOpposite
 */
export function getReflexiveClosure(g, userHiers) {
    const copy = g.copy();
    copy.forEachEdge((k, a, s, t) => {
        const { dir, field } = a;
        if (field === undefined)
            return;
        const oppDir = getOppDir(dir);
        const oppField = dir === "same" ? field : getOppFields(userHiers, field, dir)[0];
        addNodesIfNot(copy, [s, t], { order: 9999 });
        addEdgeIfNot(copy, t, s, {
            dir: oppDir,
            field: oppField,
            implied: BC_I_REFLEXIVE,
        });
    });
    return copy;
}
export function addNodesIfNot(g, nodes, attr = { order: 9999 }) {
    for (const node of nodes) {
        g.updateNode(node, (exstantAttrs) => {
            const extantOrder = exstantAttrs.order;
            return Object.assign(Object.assign({}, exstantAttrs), { order: extantOrder && extantOrder < 9999 ? extantOrder : attr.order });
        });
    }
}
export function addEdgeIfNot(g, source, target, attr) {
    if (!g.hasEdge(source, target))
        g.addEdge(source, target, attr);
}
export const getSinks = (g) => g.filterNodes((node) => g.hasNode(node) && !g.outDegree(node));
export const getSources = (g) => g.filterNodes((node) => g.hasNode(node) && !g.inDegree(node));
export const getOutNeighbours = (g, node) => g.hasNode(node) ? g.outNeighbors(node) : [];
export const getInNeighbours = (g, node) => g.hasNode(node) ? g.inNeighbors(node) : [];
/**
 * Finds all paths from a starting node to all other sinks in a graph.
 *
 *
 * @param {MultiGraph} g - The graph to search
 * @param {string} start - The starting node
 * @returns An array of arrays. Each array is a path.
 */
export function dfsAllPaths(g, start) {
    const queue = [{ node: start, path: [] }];
    const visited = {};
    const allPaths = [];
    let i = 0;
    while (queue.length > 0 && i < 1000) {
        i++;
        const { node, path } = queue.shift();
        const extPath = [node, ...path];
        const succsNotVisited = g.hasNode(node)
            ? g.filterOutNeighbors(node, (succ) => !visited[succ] || visited[succ] < 5)
            : [];
        const newItems = succsNotVisited.map((succ) => {
            visited[succ] = visited[succ] ? visited[succ] + 1 : 1;
            return { node: succ, path: extPath };
        });
        queue.unshift(...newItems);
        if (!g.hasNode(node) || !g.outDegree(node))
            allPaths.push(extPath);
    }
    return allPaths;
}
export function bfsAllPaths(g, start) {
    const pathsArr = [];
    const queue = [{ node: start, path: [] }];
    let i = 0;
    while (queue.length !== 0 && i < 1000) {
        i++;
        const { node, path } = queue.shift();
        const extPath = [node, ...path];
        const succs = g.hasNode(node)
            ? g.filterOutNeighbors(node, (n) => !path.includes(n))
            : [];
        for (const node of succs) {
            queue.push({ node, path: extPath });
        }
        // terminal node
        if (!g.hasNode(node) || succs.length === 0) {
            pathsArr.push(extPath);
        }
    }
    // Splice off the current note from the path
    pathsArr.forEach((path) => {
        if (path.length)
            path.splice(path.length - 1, 1);
    });
    info({ pathsArr });
    return pathsArr;
}
export function removeCycles(g, startNode) {
    const copy = g.copy();
    let prevNode = null;
    dfsFromNode(copy, startNode, (n) => {
        copy.forEachOutNeighbor(n, (t) => {
            if (t === prevNode && copy.hasEdge(t, prevNode)) {
                try {
                    copy.dropEdge(t, prevNode);
                }
                catch (error) {
                    console.error(t, prevNode, error);
                }
            }
        });
        prevNode = n;
    });
    return copy;
}
export function getSubCloseSub(g, userHiers, ...dirs) {
    const sub = getSubInDirs(g, ...dirs);
    const closed = getReflexiveClosure(sub, userHiers);
    const closedSub = getSubInDirs(closed, dirs[0]);
    return closedSub;
}
export function buildObsGraph() {
    const ObsG = new MultiGraph();
    const { resolvedLinks, unresolvedLinks } = app.metadataCache;
    for (const source in resolvedLinks) {
        if (!source.endsWith(".md"))
            continue;
        const sourceBase = getBaseFromMDPath(source);
        addNodesIfNot(ObsG, [sourceBase]);
        for (const dest in resolvedLinks[source]) {
            if (!dest.endsWith(".md"))
                continue;
            const destBase = getBaseFromMDPath(dest);
            addNodesIfNot(ObsG, [destBase]);
            ObsG.addEdge(sourceBase, destBase, { resolved: true });
        }
    }
    for (const source in unresolvedLinks) {
        const sourceBase = getBaseFromMDPath(source);
        addNodesIfNot(ObsG, [sourceBase]);
        for (const dest in unresolvedLinks[source]) {
            const destBase = getBaseFromMDPath(dest);
            addNodesIfNot(ObsG, [destBase]);
            if (sourceBase === destBase)
                continue;
            ObsG.addEdge(sourceBase, destBase, { resolved: false });
        }
    }
    info({ ObsG });
    return ObsG;
}
export function populateMain(settings, mainG, source, field, target, sourceOrder, targetOrder, fillOpp = false) {
    const { userHiers } = settings;
    const dir = getFieldInfo(userHiers, field).fieldDir;
    addNodesIfNot(mainG, [source], {
        order: sourceOrder,
    });
    addNodesIfNot(mainG, [target], {
        order: targetOrder,
    });
    addEdgeIfNot(mainG, source, target, {
        dir,
        field,
    });
    if (fillOpp) {
        addEdgeIfNot(mainG, target, source, {
            dir: getOppDir(dir),
            field: getOppFields(userHiers, field, dir)[0],
        });
    }
}
export const getTargetOrder = (frontms, target) => {
    var _a, _b;
    return parseInt((_b = (_a = frontms.find((ff) => { var _a; return ((_a = ff === null || ff === void 0 ? void 0 : ff.file) === null || _a === void 0 ? void 0 : _a.basename) === target; })) === null || _a === void 0 ? void 0 : _a[BC_ORDER]) !== null && _b !== void 0 ? _b : "9999");
};
export const getSourceOrder = (frontm) => { var _a; return parseInt((_a = frontm[BC_ORDER]) !== null && _a !== void 0 ? _a : "9999"); };
/** Remember to filter by hierarchy in MatrixView! */
export function getRealnImplied(plugin, currNode, dir = null) {
    const realsnImplieds = blankRealNImplied();
    const { settings, closedG } = plugin;
    const { userHiers } = settings;
    if (!closedG.hasNode(currNode))
        return realsnImplieds;
    closedG.forEachEdge(currNode, (k, a, s, t) => {
        const { field, dir: edgeDir, implied } = a;
        const oppField = getOppFields(userHiers, field, edgeDir)[0];
        (dir ? [dir, getOppDir(dir)] : DIRECTIONS).forEach((currDir) => {
            const oppDir = getOppDir(currDir);
            // Reals
            if (s === currNode && (edgeDir === currDir || edgeDir === oppDir)) {
                const arr = realsnImplieds[edgeDir].reals;
                if (arr.findIndex((item) => item.to === t) === -1) {
                    arr.push({ to: t, field, implied });
                }
            }
            // Implieds
            // If `s !== currNode` then `t` must be
            else if (edgeDir === currDir || edgeDir === oppDir) {
                const arr = realsnImplieds[getOppDir(edgeDir)].implieds;
                if (arr.findIndex((item) => item.to === s) === -1) {
                    arr.push({
                        to: s,
                        field: oppField,
                        implied,
                    });
                }
            }
        });
    });
    return realsnImplieds;
}
//# sourceMappingURL=graphUtils.js.map