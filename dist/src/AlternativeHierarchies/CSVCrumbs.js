import { debug } from "loglevel";
import { normalizePath } from "obsidian";
import { dropWikilinks } from "../Utils/ObsidianUtils";
import { addEdgeIfNot, addNodesIfNot } from "../Utils/graphUtils";
export async function getCSVRows(plugin) {
    const { CSVPaths } = plugin.settings;
    const CSVRows = [];
    if (CSVPaths === "")
        return CSVRows;
    const fullPath = normalizePath(CSVPaths);
    const content = await app.vault.adapter.read(fullPath);
    const lines = content.split("\n");
    const headers = lines[0].split(",").map((head) => head.trim());
    lines.slice(1).forEach((row) => {
        const rowObj = {};
        row
            .split(",")
            .map((head) => dropWikilinks(head.trim()))
            .forEach((item, i) => {
            rowObj[headers[i]] = item;
        });
        debug({ rowObj });
        CSVRows.push(rowObj);
    });
    return CSVRows;
}
export function addCSVCrumbs(g, CSVRows, dir, field) {
    CSVRows.forEach((row) => {
        addNodesIfNot(g, [row.file]);
        if (field === "" || !row[field])
            return;
        addNodesIfNot(g, [row[field]]);
        addEdgeIfNot(g, row.file, row[field], { dir, field });
    });
}
//# sourceMappingURL=CSVCrumbs.js.map