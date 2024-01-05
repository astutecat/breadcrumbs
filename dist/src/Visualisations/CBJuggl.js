import { getPlugin, nodeDangling, nodeFromFile, VizId, } from "juggl-api";
import { info, warn } from "loglevel";
import { Component, Events } from "obsidian";
import { JUGGL_CB_DEFAULTS } from "../constants";
const STORE_ID = "core";
function indentToDepth(indent) {
    return indent.length / 2 + 1;
}
function meetsConditions(indent, node, froms, min, max) {
    const depth = indentToDepth(indent);
    return (depth >= min &&
        depth <= max &&
        (froms === undefined || froms.includes(node)));
}
class BCStoreEvents extends Events {
}
class BCStore extends Component {
    constructor(graph, metadata, plugin) {
        super();
        this.graph = graph;
        this.cache = metadata;
        this.plugin = plugin;
    }
    asString(node) {
        const id = VizId.fromNode(node);
        return id.id.slice(0, -3);
    }
    getFile(nodeId) {
        return this.cache.getFirstLinkpathDest(nodeId.id, "");
    }
    async connectNodes(allNodes, newNodes, graph) {
        const edges = [];
        const nodesListS = new Set(allNodes.map((node) => this.asString(node)).filter((s) => s));
        newNodes.forEach((node) => {
            this.graph.forEachOutEdge(this.asString(node), (key, attr, source, target) => {
                if (nodesListS.has(target)) {
                    edges.push({
                        data: {
                            id: `BC:${source}->${target}`,
                            source: VizId.toId(source, STORE_ID) + ".md",
                            target: VizId.toId(target, STORE_ID) + ".md",
                            type: attr.field,
                            dir: attr.dir,
                        },
                        classes: `type-${attr.field} dir-${attr.dir} breadcrumbs$`,
                    });
                }
            });
        });
        return Promise.resolve(edges);
    }
    getEvents() {
        return new BCStoreEvents();
    }
    getNeighbourhood(nodeId) {
        // TODO
        return Promise.resolve([]);
    }
    // @ts-ignore
    refreshNode(view, id) {
        return;
    }
    storeId() {
        return STORE_ID;
    }
    get(nodeId) {
        const file = this.getFile(nodeId);
        if (file === null) {
            const dangling = nodeDangling(nodeId.id);
            info({ dangling });
            return Promise.resolve(nodeDangling(nodeId.id));
        }
        const cache = this.cache.getFileCache(file);
        if (cache === null) {
            info("returning empty cache", nodeId);
            return Promise.resolve(nodeDangling(nodeId.id));
        }
        // @ts-ignore
        return Promise.resolve(nodeFromFile(file, this.plugin, nodeId.toId()));
    }
}
function createJuggl(plugin, target, initialNodes, args) {
    try {
        const jugglPlugin = getPlugin(app);
        if (!jugglPlugin) {
            // TODO: Error handling
            return;
        }
        for (let key in JUGGL_CB_DEFAULTS) {
            if (key in args && args[key] === undefined) {
                args[key] = JUGGL_CB_DEFAULTS[key];
            }
        }
        const bcStore = new BCStore(plugin.mainG, app.metadataCache, jugglPlugin);
        const stores = {
            // @ts-ignore
            coreStore: bcStore,
            // @ts-ignore
            dataStores: [bcStore],
        };
        info({ args }, { initialNodes });
        const juggl = jugglPlugin.createJuggl(target, args, stores, initialNodes);
        plugin.addChild(juggl);
        juggl.load();
        info({ juggl });
    }
    catch (error) {
        warn({ error });
    }
}
export function createJugglTrail(plugin, target, paths, source, args) {
    let nodes = Array.from(new Set(paths.reduce((prev, curr) => prev.concat(curr), [])));
    nodes.push(source);
    nodes = nodes.map((s) => s + ".md");
    createJuggl(plugin, target, nodes, args);
}
export function createdJugglCB(plugin, target, args, lines, froms, source, min, max) {
    const nodes = lines
        .filter(([indent, node]) => meetsConditions(indent, node, froms, min, max))
        .map(([_, node]) => node + ".md");
    if (min <= 0) {
        nodes.push(source + ".md");
    }
    info({ lines, nodes });
    createJuggl(plugin, target, nodes, args);
}
//# sourceMappingURL=CBJuggl.js.map