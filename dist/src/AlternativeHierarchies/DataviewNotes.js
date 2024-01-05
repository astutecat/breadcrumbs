import { warn } from "loglevel";
import { Notice } from "obsidian";
import { BC_DV_NOTE, BC_DV_NOTE_FIELD, BC_IGNORE, DATAVIEW_MISSING } from "../constants";
import { getSourceOrder, getTargetOrder, populateMain, } from "../Utils/graphUtils";
import { getFields } from "../Utils/HierUtils";
import { getDVApi, getDVBasename } from "../Utils/ObsidianUtils";
export function addDataviewNotesToGraph(plugin, eligableAlts, frontms, mainG) {
    const { settings } = plugin;
    const { userHiers, dataviewNoteField } = settings;
    const dv = getDVApi(plugin);
    if (!dv && eligableAlts.length) {
        new Notice(DATAVIEW_MISSING);
        return;
    }
    const fields = getFields(userHiers);
    eligableAlts.forEach((altFile) => {
        var _a;
        const basename = getDVBasename(altFile.file);
        let query = altFile[BC_DV_NOTE];
        if (query.hasOwnProperty('path')) {
            //@ts-ignore
            query = `[[${query.path}]]`;
        }
        let field = (_a = altFile[BC_DV_NOTE_FIELD]) !== null && _a !== void 0 ? _a : (dataviewNoteField || fields[0]);
        let targets = [];
        try {
            targets = dv.pages(query).values;
        }
        catch (er) {
            new Notice(`${query} is not a valid Dataview from-query`);
            warn(er);
        }
        for (const target of targets) {
            if (target[BC_IGNORE])
                continue;
            const targetBN = getDVBasename(target.file);
            const sourceOrder = getSourceOrder(altFile);
            const targetOrder = getTargetOrder(frontms, targetBN);
            populateMain(settings, mainG, basename, field, targetBN, sourceOrder, targetOrder, true);
        }
    });
}
//# sourceMappingURL=DataviewNotes.js.map