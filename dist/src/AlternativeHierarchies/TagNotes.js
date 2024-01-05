import { info } from "loglevel";
import { BC_IGNORE, BC_TAG_NOTE, BC_TAG_NOTE_EXACT, BC_TAG_NOTE_FIELD, } from "../constants";
import { splitAndTrim } from "../Utils/generalUtils";
import { getSourceOrder, getTargetOrder, populateMain, } from "../Utils/graphUtils";
import { getFields } from "../Utils/HierUtils";
import { addHash, dropHash, getDVBasename } from "../Utils/ObsidianUtils";
const getAllTags = (file, withHash = true) => {
    var _a, _b;
    const { tags, frontmatter } = app.metadataCache.getFileCache(file);
    const allTags = [];
    tags === null || tags === void 0 ? void 0 : tags.forEach((t) => allTags.push(dropHash(t.tag)));
    [(_a = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter.tags) !== null && _a !== void 0 ? _a : []].flat().forEach((t) => {
        splitAndTrim(t).forEach((innerT) => allTags.push(dropHash(innerT)));
    });
    [(_b = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter.tag) !== null && _b !== void 0 ? _b : []].flat().forEach((t) => {
        splitAndTrim(t).forEach((innerT) => allTags.push(dropHash(innerT)));
    });
    return allTags.map((t) => (withHash ? "#" : "") + t.toLowerCase());
};
export function addTagNotesToGraph(plugin, eligableAlts, frontms, mainG) {
    const { settings } = plugin;
    const { userHiers, tagNoteField } = settings;
    const fields = getFields(userHiers);
    eligableAlts.forEach((altFile) => {
        var _a;
        const tagNoteFile = altFile.file;
        const tagNoteBasename = getDVBasename(tagNoteFile);
        const tag = addHash(altFile[BC_TAG_NOTE].trim().toLowerCase());
        info({ tag });
        const hasThisTag = (file) => {
            const allTags = getAllTags(file);
            return altFile[BC_TAG_NOTE_EXACT] !== undefined
                ? allTags.includes(tag)
                : allTags.some((t) => t.includes(tag));
        };
        const targets = frontms
            .map((ff) => ff.file)
            .filter((file) => file.path !== tagNoteFile.path && hasThisTag(file) && !file[BC_IGNORE])
            .map(getDVBasename);
        info({ targets });
        let field = (_a = altFile[BC_TAG_NOTE_FIELD]) !== null && _a !== void 0 ? _a : (tagNoteField || fields[0]);
        targets.forEach((target) => {
            const sourceOrder = getSourceOrder(altFile);
            const targetOrder = getTargetOrder(frontms, tagNoteBasename);
            populateMain(settings, mainG, tagNoteBasename, field, target, sourceOrder, targetOrder, true);
        });
    });
}
//# sourceMappingURL=TagNotes.js.map