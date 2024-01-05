import { parseTypedLink } from "juggl-api";
import { splitLinksRegex } from "../constants";
import { getTargetOrder, populateMain } from "../Utils/graphUtils";
import { getFieldInfo, getFields } from "../Utils/HierUtils";
// TODO I think it'd be better to do this whole thing as an obj instead of JugglLink[]
// => {[note: string]: {type: string, linksInLine: string[]}[]}
export async function getJugglLinks(plugin, files) {
    const { settings, db } = plugin;
    db.start2G("getJugglLinks");
    const { userHiers } = settings;
    // Add Juggl links
    const typedLinksArr = await Promise.all(files.map(async (file) => {
        var _a, _b;
        const jugglLink = { file, links: [] };
        // Use Obs metadatacache to get the links in the current file
        const links = (_b = (_a = app.metadataCache.getFileCache(file)) === null || _a === void 0 ? void 0 : _a.links) !== null && _b !== void 0 ? _b : [];
        const content = links.length ? await app.vault.cachedRead(file) : "";
        const lines = content.split("\n");
        links.forEach((link) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const lineNo = link.position.start.line;
            const line = lines[lineNo];
            // Check the line for wikilinks, and return an array of link.innerText
            const linksInLine = (_c = (_b = (_a = line
                .match(splitLinksRegex)) === null || _a === void 0 ? void 0 : _a.map((link) => link.slice(2, link.length - 2))) === null || _b === void 0 ? void 0 : _b.map((innerText) => innerText.split("|")[0])) !== null && _c !== void 0 ? _c : [];
            const typedLinkPrefix = (_e = (_d = app.plugins.plugins.juggl) === null || _d === void 0 ? void 0 : _d.settings.typedLinkPrefix) !== null && _e !== void 0 ? _e : "-";
            const parsedLinks = parseTypedLink(link, line, typedLinkPrefix);
            const field = (_g = (_f = parsedLinks === null || parsedLinks === void 0 ? void 0 : parsedLinks.properties) === null || _f === void 0 ? void 0 : _f.type) !== null && _g !== void 0 ? _g : "";
            if (field === "")
                return;
            const { fieldDir } = getFieldInfo(userHiers, field) || {};
            if (!fieldDir)
                return;
            jugglLink.links.push({
                dir: fieldDir,
                field,
                linksInLine,
            });
        });
        return jugglLink;
    }));
    const allFields = getFields(userHiers);
    const filteredLinks = typedLinksArr.map((jugglLink) => {
        // Filter out links whose type is not in allFields
        jugglLink.links = jugglLink.links.filter((link) => allFields.includes(link.field));
        return jugglLink;
    });
    db.end2G({ filteredLinks });
    return filteredLinks;
}
export function addJugglLinksToGraph(settings, jugglLinks, frontms, mainG) {
    jugglLinks.forEach((jugglLink) => {
        const { basename } = jugglLink.file;
        jugglLink.links.forEach((link) => {
            const { dir, field, linksInLine } = link;
            if (dir === "")
                return;
            const sourceOrder = getTargetOrder(frontms, basename);
            linksInLine.forEach((linkInLine) => {
                // Is this a bug? Why not `getSourceOrder`?
                const targetsOrder = getTargetOrder(frontms, linkInLine);
                populateMain(settings, mainG, basename, field, linkInLine, sourceOrder, targetsOrder);
            });
        });
    });
}
//# sourceMappingURL=JugglLinks.js.map