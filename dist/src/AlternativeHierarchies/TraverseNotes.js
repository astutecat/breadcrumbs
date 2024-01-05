import { info } from "loglevel";
import { BC_TRAVERSE_NOTE } from "../constants";
import { dfsAllPaths, populateMain, removeCycles } from "../Utils/graphUtils";
import { getFields } from "../Utils/HierUtils";
import { getDVBasename } from "../Utils/ObsidianUtils";
export function addTraverseNotesToGraph(plugin, traverseNotes, mainG, obsG) {
    const { settings } = plugin;
    const { userHiers } = settings;
    const fields = getFields(userHiers);
    traverseNotes.forEach((altFile) => {
        const { file } = altFile;
        const basename = getDVBasename(file);
        const noCycles = removeCycles(obsG, basename);
        let field = altFile[BC_TRAVERSE_NOTE];
        if (typeof field !== "string" || !fields.includes(field))
            return;
        const allPaths = dfsAllPaths(noCycles, basename);
        info(allPaths);
        const reversed = [...allPaths].map((path) => path.reverse());
        reversed.forEach((path) => {
            path.forEach((node, i) => {
                const next = path[i + 1];
                if (next === undefined)
                    return;
                populateMain(settings, mainG, node, field, next, 9999, 9999, true);
            });
        });
    });
}
//# sourceMappingURL=TraverseNotes.js.map