import { getDVBasename, getSettings } from "../../Utils/ObsidianUtils";
import { addEdgeIfNot, addNodesIfNot } from "../../Utils/graphUtils";
import { getFieldInfo, getFields, getOppDir, getOppFields } from "../../Utils/HierUtils";
export async function getHierarchyNoteItems(file) {
    const { listItems } = app.metadataCache.getFileCache(file);
    if (!listItems)
        return [];
    const basename = getDVBasename(file);
    const { hierarchyNoteIsParent } = getSettings();
    const lines = (await app.vault.cachedRead(file)).split("\n");
    const hierarchyNoteItems = [];
    const afterBulletReg = new RegExp(/\s*[+*-]\s(.*$)/);
    const dropWikiLinksReg = new RegExp(/\[\[(.*?)\]\]/);
    const fieldReg = new RegExp(/(.*?)\[\[.*?\]\]/);
    for (const item of listItems) {
        const line = lines[item.position.start.line];
        const afterBulletCurr = afterBulletReg.exec(line)[1];
        const note = dropWikiLinksReg.exec(afterBulletCurr)[1];
        let field = fieldReg.exec(afterBulletCurr)[1].trim() || null;
        const { parent } = item;
        if (parent >= 0) {
            const parentNote = lines[parent];
            const afterBulletParent = afterBulletReg.exec(parentNote)[1];
            const dropWikiParent = dropWikiLinksReg.exec(afterBulletParent)[1];
            hierarchyNoteItems.push({
                note,
                parent: dropWikiParent,
                field,
            });
        }
        else {
            hierarchyNoteItems.push({
                note,
                parent: hierarchyNoteIsParent ? basename : null,
                field,
            });
        }
    }
    return hierarchyNoteItems;
}
export function addHNsToGraph(settings, hnArr, mainG) {
    const { HNUpField, userHiers } = settings;
    const upFields = getFields(userHiers, "up");
    hnArr.forEach((hnItem, i) => {
        var _a, _b;
        const { note, field, parent } = hnItem;
        const targetField = field !== null && field !== void 0 ? field : (HNUpField || upFields[0]);
        const dir = (_a = getFieldInfo(userHiers, targetField)) === null || _a === void 0 ? void 0 : _a.fieldDir;
        const oppDir = getOppDir(dir);
        const oppField = getOppFields(userHiers, targetField, dir)[0];
        if (parent === null) {
            const s = note;
            const t = (_b = hnArr[i + 1]) === null || _b === void 0 ? void 0 : _b.note;
            addNodesIfNot(mainG, [s, t]);
            addEdgeIfNot(mainG, s, t, { dir: oppDir, field: oppField });
        }
        else {
            addNodesIfNot(mainG, [note, parent]);
            if (settings.showUpInJuggl) {
                addEdgeIfNot(mainG, note, parent, {
                    dir,
                    field: targetField,
                });
            }
            addEdgeIfNot(mainG, parent, note, {
                dir: oppDir,
                field: oppField,
            });
        }
    });
}
//# sourceMappingURL=HierarchyNotes.js.map