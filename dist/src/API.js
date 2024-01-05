import { ARROW_DIRECTIONS, DIRECTIONS } from "./constants";
import { getMatrixNeighbours } from "./Views/MatrixView";
import { buildObsGraph, dfsAllPaths, getSubForFields, getSubInDirs, } from "./Utils/graphUtils";
import { getFieldInfo, getFields, getOppDir, getOppFields, iterateHiers, } from "./Utils/HierUtils";
import { createIndex } from "./Commands/CreateIndex";
import { refreshIndex } from "./refreshIndex";
import { getCurrFile } from "./Utils/ObsidianUtils";
export class BCAPI {
    constructor(plugin) {
        this.DIRECTIONS = DIRECTIONS;
        this.ARROW_DIRECTIONS = ARROW_DIRECTIONS;
        this.buildObsGraph = buildObsGraph;
        this.refreshIndex = async () => await refreshIndex(this.plugin);
        this.getSubInDirs = (dirs, g = this.mainG) => getSubInDirs(g, ...dirs);
        this.getSubForFields = (fields, g = this.mainG) => getSubForFields(g, fields);
        this.dfsAllPaths = (fromNode, g) => { var _a; if (fromNode === void 0) { fromNode = (_a = getCurrFile()) === null || _a === void 0 ? void 0 : _a.basename; } if (g === void 0) { g = this.mainG; } return dfsAllPaths(g, fromNode); };
        this.createIndex = (allPaths, wikilinks = false, indent = '  ') => createIndex(allPaths, wikilinks, indent);
        this.getMatrixNeighbours = (fromNode) => { var _a; if (fromNode === void 0) { fromNode = (_a = getCurrFile()) === null || _a === void 0 ? void 0 : _a.basename; } return getMatrixNeighbours(this.plugin, fromNode); };
        this.getOppDir = (dir) => getOppDir(dir);
        this.getOppFields = (field) => {
            const { fieldDir } = getFieldInfo(this.plugin.settings.userHiers, field);
            return getOppFields(this.plugin.settings.userHiers, field, fieldDir);
        };
        this.getFieldInfo = (field) => getFieldInfo(this.plugin.settings.userHiers, field);
        this.getFields = (dir) => getFields(this.plugin.settings.userHiers, dir !== null && dir !== void 0 ? dir : "all");
        this.plugin = plugin;
        this.mainG = this.plugin.mainG;
        this.closedG = this.plugin.closedG;
    }
    iterateHiers(cb) {
        iterateHiers(this.plugin.settings.userHiers, cb);
    }
}
//# sourceMappingURL=API.js.map