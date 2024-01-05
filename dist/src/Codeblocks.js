import { info } from "loglevel";
import { Notice } from "obsidian";
import { getDVApi } from "./Utils/ObsidianUtils";
import { createIndex, indexToLinePairs } from "./Commands/CreateIndex";
import CBTree from "./Components/CBTree.svelte";
import { CODEBLOCK_FIELDS, CODEBLOCK_TYPES, DIRECTIONS } from "./constants";
import { dropFolder, splitAndTrim } from "./Utils/generalUtils";
import { dfsAllPaths, getReflexiveClosure, getSubForFields, getSubInDirs, } from "./Utils/graphUtils";
import { getFieldInfo, getFields, getOppDir } from "./Utils/HierUtils";
import { createJuggl } from "./Visualisations/Juggl";
export function getCodeblockCB(plugin) {
    const { settings, db } = plugin;
    const { userHiers, createIndexIndent } = settings;
    return (source, el, ctx) => {
        var _a;
        db.start2G("Codeblock");
        const parsedSource = parseCodeBlockSource(source);
        const err = codeblockError(plugin, parsedSource);
        if (err !== "") {
            el.innerHTML = err;
            db.end2G();
            return;
        }
        let min = 0, max = Infinity;
        let { depth, dir, fields, from, implied, flat } = parsedSource;
        if (depth !== undefined) {
            const minNum = parseInt(depth[0]);
            if (!isNaN(minNum))
                min = minNum;
            const maxNum = parseInt(depth[1]);
            if (!isNaN(maxNum))
                max = maxNum;
        }
        const currFile = app.metadataCache.getFirstLinkpathDest(ctx.sourcePath, "");
        const { basename } = currFile;
        let froms = undefined;
        if (from !== undefined) {
            try {
                const api = getDVApi(plugin);
                if (api) {
                    const pages = (_a = api.pagePaths(from)) === null || _a === void 0 ? void 0 : _a.values;
                    froms = pages.map(dropFolder);
                }
                else
                    new Notice("Dataview must be enabled for `from` to work.");
            }
            catch (e) {
                new Notice(`The query "${from}" failed.`);
            }
        }
        const oppDir = getOppDir(dir);
        const sub = implied === false
            ? getSubInDirs(plugin.mainG, dir)
            : getSubInDirs(plugin.mainG, dir, oppDir);
        const closed = getReflexiveClosure(sub, userHiers);
        const subFields = fields !== null && fields !== void 0 ? fields : getFields(userHiers);
        const subClosed = getSubForFields(getSubInDirs(closed, dir), subFields);
        const allPaths = dfsAllPaths(subClosed, basename);
        const index = createIndex(allPaths, false, createIndexIndent);
        info({ allPaths, index });
        const lines = indexToLinePairs(index, flat);
        switch (parsedSource.type) {
            case "tree":
                new CBTree({
                    target: el,
                    props: {
                        plugin,
                        el,
                        min,
                        max,
                        lines,
                        froms,
                        basename,
                        parsedSource,
                    },
                });
                break;
            case "juggl":
                createdJugglCB(plugin, el, parsedSource, lines, froms, basename, min, max);
                break;
        }
        db.end2G();
    };
}
/**
 * Parse a string as a boolean value. If not "true" or "false", return `value`.
 * @param {string} value - string
 * @returns {string | boolean}
 */
const parseAsBool = (value) => value === "true" ? true : value === "false" ? false : value;
function parseCodeBlockSource(source) {
    const lines = source.split("\n");
    const getValue = (type) => {
        var _a, _b, _c;
        return (_c = (_b = (_a = lines
            .find((l) => l.startsWith(`${type}:`))) === null || _a === void 0 ? void 0 : _a.split(":")) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c.trim();
    };
    const results = {};
    CODEBLOCK_FIELDS.forEach((field) => {
        const value = getValue(field);
        results[field] = parseAsBool(value);
    });
    results.fields = results.fields
        ? splitAndTrim(results.fields)
        : undefined;
    if (results.depth) {
        const match = results.depth.match(/(\d*)-?(\d*)/);
        results.depth = [match[1], match[2]];
    }
    return results;
}
function codeblockError(plugin, parsedSource) {
    var _a;
    const { dir, fields, type, title, depth, flat, content, from, implied } = parsedSource;
    const { userHiers } = plugin.settings;
    let err = "";
    if (!CODEBLOCK_TYPES.includes(type))
        err += `<code>type: ${type}</code> is not a valid type. It must be one of: ${CODEBLOCK_TYPES.map((type) => `<code>${type}</code>`).join(", ")}.</br>`;
    const validDir = DIRECTIONS.includes(dir);
    if (!validDir)
        err += `<code>dir: ${dir}</code> is not a valid direction.</br>`;
    const allFields = getFields(userHiers);
    (_a = [fields].flat()) === null || _a === void 0 ? void 0 : _a.forEach((f) => {
        if (f !== undefined && !allFields.includes(f))
            err += `<code>fields: ${f}</code> is not a field in your hierarchies.</br>`;
    });
    if (title !== undefined && title !== false)
        err += `<code>title: ${title}</code> is not a valid value. It has to be <code>false</code>, or leave the entire line out.</br>`;
    if (depth !== undefined && depth.every((num) => isNaN(parseInt(num))))
        err += `<code>depth: ${depth}</code> is not a valid value. It has to be a number.</br>`;
    if (flat !== undefined && flat !== true)
        err += `<code>flat: ${flat}</code> is not a valid value. It has to be <code>true</code>, or leave the entire line out.</br>`;
    if (content !== undefined && content !== "open" && content !== "closed")
        err += `<code>content: ${content}</code> is not a valid value. It has to be <code>open</code> or <code>closed</code>, or leave the entire line out.</br>`;
    if (from !== undefined &&
        !app.plugins.enabledPlugins.has("dataview")) {
        err += `Dataview must be enabled to use <code>from</code>.</br>`;
    }
    if (implied !== undefined && implied !== false)
        err += `<code>implied: ${implied}</code> is not a valid value. It has to be <code>false</code>, or leave the entire line out.</br>`;
    return err === ""
        ? ""
        : `${err}</br>
    A valid example would be:
    <pre><code>
      type: tree
      dir: ${validDir ? dir : "down"}
      fields: ${allFields
            .map((f) => {
            return { f, dir: getFieldInfo(userHiers, f).fieldDir };
        })
            .filter((info) => info.dir === dir)
            .map((info) => info.f)
            .join(", ") || "child"}
      depth: 3
      </code></pre>`;
}
const indentToDepth = (indent) => indent.length / 2 + 1;
export function meetsConditions(indent, node, froms, min, max) {
    const depth = indentToDepth(indent);
    return (depth >= min &&
        depth <= max &&
        (froms === undefined || froms.includes(node)));
}
export function createdJugglCB(plugin, target, args, lines, froms, source, min, max) {
    const nodes = lines
        .filter(([indent, node]) => meetsConditions(indent, node, froms, min, max))
        .map(([_, node]) => node + ".md");
    if (min <= 0)
        nodes.push(source + ".md");
    createJuggl(plugin, target, nodes, args);
}
//# sourceMappingURL=Codeblocks.js.map