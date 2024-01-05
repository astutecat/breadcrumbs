import { info } from "loglevel";
import { BC_IGNORE, BC_REGEX_NOTE, BC_REGEX_NOTE_FIELD } from "../constants";
import { strToRegex } from "../Utils/generalUtils";
import { getSourceOrder, getTargetOrder, populateMain, } from "../Utils/graphUtils";
import { getFields } from "../Utils/HierUtils";
import { getDVBasename } from "../Utils/ObsidianUtils";
export function addRegexNotesToGraph(plugin, eligableAlts, frontms, mainG) {
    const { settings } = plugin;
    const { userHiers, regexNoteField } = settings;
    const fields = getFields(userHiers);
    eligableAlts.forEach((altFile) => {
        const regexNoteFile = altFile.file;
        const regexNoteBasename = getDVBasename(regexNoteFile);
        const regex = strToRegex(altFile[BC_REGEX_NOTE]);
        info({ regex });
        let field = altFile[BC_REGEX_NOTE_FIELD];
        if (typeof field !== "string" || !fields.includes(field))
            field = regexNoteField || fields[0];
        const targets = [];
        frontms.forEach((page) => {
            if (page[BC_IGNORE])
                return;
            const basename = getDVBasename(page.file);
            if (basename !== regexNoteBasename && regex.test(basename))
                targets.push(basename);
        });
        for (const target of targets) {
            const sourceOrder = getSourceOrder(altFile);
            const targetOrder = getTargetOrder(frontms, regexNoteBasename);
            populateMain(settings, mainG, regexNoteBasename, field, target, sourceOrder, targetOrder, true);
        }
    });
}
//# sourceMappingURL=RegexNotes.js.map