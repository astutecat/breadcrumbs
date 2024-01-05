import { BC_LINK_NOTE } from "../constants";
import { getSourceOrder, getTargetOrder, populateMain, } from "../Utils/graphUtils";
import { getFields } from "../Utils/HierUtils";
import { getDVBasename } from "../Utils/ObsidianUtils";
export function addLinkNotesToGraph(plugin, eligableAlts, frontms, mainG) {
    const { settings } = plugin;
    const { userHiers } = settings;
    const fields = getFields(userHiers);
    eligableAlts.forEach((altFile) => {
        var _a, _b, _c, _d;
        const linkNoteFile = altFile.file;
        const linkNoteBasename = getDVBasename(linkNoteFile);
        let field = altFile[BC_LINK_NOTE];
        if (typeof field !== "string" || !fields.includes(field))
            return;
        const links = (_b = (_a = app.metadataCache
            .getFileCache(linkNoteFile)) === null || _a === void 0 ? void 0 : _a.links) === null || _b === void 0 ? void 0 : _b.map((l) => l.link.match(/[^#|]+/)[0]);
        const embeds = (_d = (_c = app.metadataCache
            .getFileCache(linkNoteFile)) === null || _c === void 0 ? void 0 : _c.embeds) === null || _d === void 0 ? void 0 : _d.map((l) => l.link.match(/[^#|]+/)[0]);
        const targets = [...(links !== null && links !== void 0 ? links : []), ...(embeds !== null && embeds !== void 0 ? embeds : [])];
        for (const target of targets) {
            const sourceOrder = getSourceOrder(altFile);
            const targetOrder = getTargetOrder(frontms, linkNoteBasename);
            populateMain(settings, mainG, linkNoteBasename, field, target, sourceOrder, targetOrder, true);
        }
    });
}
//# sourceMappingURL=LinkNotes.js.map