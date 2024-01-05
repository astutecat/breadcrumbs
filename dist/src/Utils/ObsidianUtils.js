import { info } from "loglevel";
import { parseYaml, stringifyYaml, } from "obsidian";
import { isInVault, wait, waitForResolvedLinks, } from "obsidian-community-lib/dist/utils";
import { splitAndTrim } from "./generalUtils";
export const getSettings = () => app.plugins.plugins.breadcrumbs.settings;
export const getCurrFile = () => app.workspace.getActiveFile();
/**
 * Get basename from a **Markdown** `path`
 * @param  {string} path
 */
export const getBaseFromMDPath = (path) => {
    const splitSlash = path.split("/").last();
    if (splitSlash.endsWith(".md")) {
        return splitSlash.split(".md").slice(0, -1).join(".");
    }
    else
        return splitSlash;
};
export const getDVBasename = (file) => file.basename || file.name;
export const getFolderName = (file) => { var _a; 
//@ts-ignore
return ((_a = file === null || file === void 0 ? void 0 : file.parent) === null || _a === void 0 ? void 0 : _a.name) || file.folder; };
export function makeWiki(str, wikiQ = true) {
    let copy = str.slice();
    if (wikiQ) {
        copy = "[[" + copy;
        copy += "]]";
    }
    return copy;
}
export function dropWikilinks(str) {
    let copy = str.slice();
    if (copy.startsWith("[[") && copy.endsWith("]]"))
        copy = copy.slice(2, -2);
    return copy;
}
/**
 * Adds or updates the given yaml `key` to `value` in the given TFile
 * @param  {string} key
 * @param  {string} value
 * @param  {TFile} file
 * @param  {FrontMatterCache|undefined} frontmatter
 * @param  {MetaeditApi} api
 */
export const createOrUpdateYaml = async (key, value, file, frontmatter, api) => {
    const valueStr = value.toString();
    if (!frontmatter || frontmatter[key] === undefined) {
        info(`Creating: ${key}: ${valueStr}`);
        await api.createYamlProperty(key, `['${valueStr}']`, file);
    }
    else if ([...[frontmatter[key]]].flat(3).some((val) => val == valueStr)) {
        info("Already Exists!");
        return;
    }
    else {
        const oldValueFlat = [...[frontmatter[key]]].flat(4);
        const newValue = [...oldValueFlat, `'${valueStr}'`];
        info(`Updating: ${key}: ${newValue}`);
        await api.update(key, `[${newValue.join(", ")}]`, file);
    }
};
export function changeYaml(yaml, key, newVal) {
    if (yaml === "") {
        return `${key}: ['${newVal}']`;
    }
    else {
        const parsed = parseYaml(yaml);
        const value = parsed[key];
        if (value === undefined) {
            parsed[key] = newVal;
        }
        else if (typeof value === "string" && value !== newVal) {
            parsed[key] = [value, newVal];
        }
        else if (typeof (value === null || value === void 0 ? void 0 : value[0]) === "string" &&
            value.includes &&
            !value.includes(newVal)) {
            parsed[key] = [...value, newVal];
        }
        // else if (other types of values...)
        return stringifyYaml(parsed);
    }
}
export function splitAtYaml(content) {
    if (!content.startsWith("---\n"))
        return ["", content];
    else {
        const splits = content.split("---");
        return [
            splits.slice(0, 2).join("---") + "---",
            splits.slice(2).join("---"),
        ];
    }
}
export const dropHash = (tag) => tag.startsWith("#") ? tag.slice(1) : tag;
export const addHash = (tag) => (tag.startsWith("#") ? tag : `#${tag}`);
export function getAlt(node, plugin) {
    var _a;
    const { altLinkFields, showAllAliases } = plugin.settings;
    if (altLinkFields.length) {
        const file = app.metadataCache.getFirstLinkpathDest(node, "");
        if (file) {
            const metadata = app.metadataCache.getFileCache(file);
            for (const altField of altLinkFields) {
                const value = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.frontmatter) === null || _a === void 0 ? void 0 : _a[altField];
                const arr = typeof value === "string" ? splitAndTrim(value) : value;
                if (value)
                    return showAllAliases ? arr.join(", ") : arr[0];
            }
        }
    }
    else
        return null;
}
export async function waitForCache(plugin) {
    var _a;
    if (app.plugins.enabledPlugins.has("dataview")) {
        let basename;
        while (!basename || !app.plugins.plugins.dataview.api.page(basename)) {
            await wait(100);
            basename = (_a = getCurrFile()) === null || _a === void 0 ? void 0 : _a.basename;
        }
    }
    else {
        await waitForResolvedLinks();
    }
}
export const linkClass = (to, realQ = true) => `internal-link BC-Link ${isInVault(to) ? "" : "is-unresolved"} ${realQ ? "" : "BC-Implied"}`;
export const getDVApi = (plugin) => { var _a; return (_a = app.plugins.plugins.dataview) === null || _a === void 0 ? void 0 : _a.api; };
export function isInsideYaml() {
    const { workspace, metadataCache } = app;
    const { activeLeaf } = workspace;
    const { state: { mode }, } = activeLeaf.getViewState();
    if (mode !== "source")
        return null;
    const { editor } = activeLeaf.view;
    const file = getCurrFile();
    if (!file)
        return null;
    const { frontmatter } = metadataCache.getFileCache(file);
    if (!frontmatter)
        return false;
    const { start, end } = frontmatter.position;
    const currOff = editor.posToOffset(editor.getCursor());
    if (currOff >= start.offset && currOff <= end.offset)
        return true;
    else
        return false;
}
//# sourceMappingURL=ObsidianUtils.js.map