import { cloneDeep } from "lodash";
import { info } from "loglevel";
import { copy } from "obsidian-community-lib/dist/utils";
import { dfsAllPaths, getSinks, getSubInDirs } from "../Utils/graphUtils";
import { getCurrFile, makeWiki } from "../Utils/ObsidianUtils";
/**
 * Returns a copy of `index`, doesn't mutate.
 * @param  {string} index
 */
export function addAliasesToIndex(plugin, index) {
    var _a, _b, _c, _d;
    const { aliasesInIndex } = plugin.settings;
    const lines = index.slice().split("\n");
    if (aliasesInIndex) {
        for (let line of lines) {
            const [indent, ...content] = line.split("- ");
            const note = content.join("- ");
            if (!note)
                continue;
            const currFile = app.metadataCache.getFirstLinkpathDest(note, "");
            if (currFile !== null) {
                const cache = app.metadataCache.getFileCache(currFile);
                const alias = (_b = (_a = cache === null || cache === void 0 ? void 0 : cache.frontmatter) === null || _a === void 0 ? void 0 : _a.alias) !== null && _b !== void 0 ? _b : [];
                const aliases = (_d = (_c = cache === null || cache === void 0 ? void 0 : cache.frontmatter) === null || _c === void 0 ? void 0 : _c.aliases) !== null && _d !== void 0 ? _d : [];
                const allAliases = [...[alias].flat(3), ...[aliases].flat(3)];
                if (allAliases.length) {
                    line += ` (${allAliases.join(", ")})`;
                }
            }
        }
    }
    return lines.join("\n");
}
/**
 * Create an index of all the paths in the graph.
 * @param allPaths - A list of all paths from the root to the leaves.
 * @param {boolean} asWikilinks - Whether to use wikilinks instead of plain text.
 * @returns A string.
 */
export function createIndex(allPaths, asWikilinks, indent = "  ") {
    let index = "";
    const copy = cloneDeep(allPaths);
    const reversed = copy.map((path) => path.reverse());
    reversed.forEach((path) => path.shift());
    const realIndent = indent === '\\t' ? '\t' : indent;
    const visited = {};
    reversed.forEach((path) => {
        for (let depth = 0; depth < path.length; depth++) {
            const currNode = path[depth];
            // If that node has been visited before at the current depth
            if (visited.hasOwnProperty(currNode) &&
                visited[currNode].includes(depth))
                continue;
            else {
                index += `${realIndent.repeat(depth)}- ${asWikilinks ? makeWiki(currNode) : currNode}\n`;
                if (!visited.hasOwnProperty(currNode))
                    visited[currNode] = [];
                visited[currNode].push(depth);
            }
        }
    });
    return index;
}
export async function copyLocalIndex(plugin) {
    const { settings, closedG } = plugin;
    const { wikilinkIndex, createIndexIndent } = settings;
    const { basename } = getCurrFile();
    const onlyDowns = getSubInDirs(closedG, "down");
    const allPaths = dfsAllPaths(onlyDowns, basename);
    const index = addAliasesToIndex(plugin, createIndex(allPaths, wikilinkIndex, createIndexIndent));
    info({ index });
    await copy(index);
}
export async function copyGlobalIndex(plugin) {
    const { settings, closedG } = plugin;
    const { wikilinkIndex, createIndexIndent } = settings;
    const onlyDowns = getSubInDirs(closedG, "down");
    const onlyUps = getSubInDirs(closedG, "up");
    const sinks = getSinks(onlyUps);
    let globalIndex = "";
    sinks.forEach((terminal) => {
        globalIndex += terminal + "\n";
        const allPaths = dfsAllPaths(onlyDowns, terminal);
        globalIndex +=
            addAliasesToIndex(plugin, createIndex(allPaths, wikilinkIndex, createIndexIndent)) + "\n";
    });
    info({ globalIndex });
    await copy(globalIndex);
}
export const indexToLinePairs = (index, flat = false) => index
    .split("\n")
    .map((line) => {
    const [indent, ...content] = line.split("- ");
    return [flat ? "" : indent, content.join("- ")];
})
    .filter((pair) => pair[1] !== "");
//# sourceMappingURL=CreateIndex.js.map