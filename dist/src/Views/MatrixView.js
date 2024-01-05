import { error, info } from "loglevel";
import { ItemView } from "obsidian";
import { Debugger } from "src/Debugger";
import Matrix from "../Components/Matrix.svelte";
import { ARROW_DIRECTIONS, blankRealNImplied, MATRIX_VIEW, TRAIL_ICON, } from "../constants";
import { splitAndTrim } from "../Utils/generalUtils";
import { getOppDir, getOppFields } from "../Utils/HierUtils";
import { getDVApi, getCurrFile, linkClass } from "../Utils/ObsidianUtils";
export function getMatrixNeighbours(plugin, currNode) {
    const { closedG, settings } = plugin;
    const { userHiers } = settings;
    const neighbours = blankRealNImplied();
    if (!closedG)
        return neighbours;
    closedG.forEachEdge(currNode, (k, a, s, t) => {
        const { field, dir, implied } = a;
        if (s === currNode) {
            neighbours[dir].reals.push({ to: t, field, implied });
        }
        else {
            neighbours[getOppDir(dir)].implieds.push({
                to: s,
                field: getOppFields(userHiers, field, dir)[0],
                implied,
            });
        }
    });
    return neighbours;
}
export default class MatrixView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.icon = TRAIL_ICON;
        this.toInternalLinkObj = (to, realQ = true, parent, implied) => {
            return {
                to,
                cls: linkClass(to, realQ),
                alt: this.getAlt(to),
                order: this.getOrder(to),
                parent,
                implied,
            };
        };
        this.getOrder = (node) => Number.parseInt(this.plugin.mainG.getNodeAttribute(node, "order"));
        this.sortItemsAlpha = (a, b) => {
            var _a, _b;
            const { sortByNameShowAlias, alphaSortAsc } = this.plugin.settings;
            const aToSort = (sortByNameShowAlias ? a.to : (_a = a.alt) !== null && _a !== void 0 ? _a : a.to).toLowerCase();
            const bToSort = (sortByNameShowAlias ? b.to : (_b = b.alt) !== null && _b !== void 0 ? _b : b.to).toLowerCase();
            const less = alphaSortAsc ? -1 : 1;
            const more = alphaSortAsc ? 1 : -1;
            return aToSort < bToSort ? less : more;
        };
        this.plugin = plugin;
        this.db = new Debugger(plugin);
    }
    async onload() {
        super.onload();
        const { plugin } = this;
        app.workspace.onLayoutReady(() => {
            setTimeout(async () => await this.draw(), app.plugins.plugins.dataview
                ? app.plugins.plugins.dataview.api
                    ? 1
                    : plugin.settings.dvWaitTime
                : 3000);
        });
    }
    getViewType() {
        return MATRIX_VIEW;
    }
    getDisplayText() {
        return "Breadcrumbs Matrix";
    }
    async onOpen() { }
    onClose() {
        var _a;
        (_a = this.view) === null || _a === void 0 ? void 0 : _a.$destroy();
        return Promise.resolve();
    }
    getAlt(node) {
        const { plugin } = this;
        const { altLinkFields, showAllAliases } = plugin.settings;
        if (!altLinkFields.length)
            return null;
        // dv First
        const dv = getDVApi(plugin);
        if (dv) {
            const page = dv.page(node);
            if (!page)
                return null;
            for (const alt of altLinkFields) {
                const value = page[alt];
                const arr = typeof value === "string" ? splitAndTrim(value) : value;
                if (value)
                    return showAllAliases ? arr.join(", ") : arr[0];
            }
        }
        else {
            const file = app.metadataCache.getFirstLinkpathDest(node, "");
            if (file) {
                const { frontmatter } = app.metadataCache.getFileCache(file);
                for (const altField of altLinkFields) {
                    const value = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter[altField];
                    const arr = typeof value === "string" ? splitAndTrim(value) : value;
                    if (value)
                        return showAllAliases ? arr.join(", ") : arr[0];
                }
            }
        }
    }
    // ANCHOR Remove duplicate implied links
    removeDuplicateImplied(reals, implieds) {
        const realTos = reals.map((real) => real.to);
        return implieds.filter((implied) => !realTos.includes(implied.to));
    }
    getHierSquares(userHiers, currFile) {
        const { plugin } = this;
        const { mainG, settings } = plugin;
        const { enableAlphaSort, squareDirectionsOrder } = settings;
        if (!mainG)
            return [];
        const { basename } = currFile;
        if (!mainG.hasNode(basename))
            return [];
        const realsnImplieds = getMatrixNeighbours(plugin, basename);
        return userHiers.map((hier) => {
            const filteredRealNImplied = blankRealNImplied();
            const resultsFilter = (item, dir, oppDir, arrow) => hier[dir].includes(item.field) ||
                (item.field.includes(`<${arrow}>`) &&
                    hier[oppDir].includes(item.field.split(" <")[0]));
            for (const dir in realsnImplieds) {
                const oppDir = getOppDir(dir);
                const arrow = ARROW_DIRECTIONS[dir];
                const { reals, implieds } = realsnImplieds[dir];
                filteredRealNImplied[dir].reals = reals
                    .filter((real) => resultsFilter(real, dir, oppDir, arrow))
                    .map((item) => this.toInternalLinkObj(item.to, true, null, item.implied));
                filteredRealNImplied[dir].implieds = implieds
                    .filter((implied) => resultsFilter(implied, dir, oppDir, arrow))
                    .map((item) => this.toInternalLinkObj(item.to, false, null, item.implied));
            }
            let { up: { reals: ru, implieds: iu }, same: { reals: rs, implieds: is }, down: { reals: rd, implieds: id }, next: { reals: rn, implieds: iN }, prev: { reals: rp, implieds: ip }, } = filteredRealNImplied;
            // !SECTION
            [iu, is, id, iN, ip] = [
                this.removeDuplicateImplied(ru, iu),
                this.removeDuplicateImplied(rs, is),
                this.removeDuplicateImplied(rd, id),
                this.removeDuplicateImplied(rn, iN),
                this.removeDuplicateImplied(rp, ip),
            ];
            const iSameNoDup = [];
            is.forEach((impSib) => {
                if (iSameNoDup.every((noDup) => noDup.to !== impSib.to)) {
                    iSameNoDup.push(impSib);
                }
            });
            is = iSameNoDup;
            const getFieldInHier = (dir) => hier[dir][0]
                ? hier[dir].join(", ")
                : `${hier[getOppDir(dir)].join(",")}${ARROW_DIRECTIONS[dir]}`;
            const squares = [ru, rs, rd, rn, rp, iu, is, id, iN, ip];
            if (enableAlphaSort)
                squares.forEach((sq) => sq.sort(this.sortItemsAlpha));
            squares.forEach((sq) => sq.sort((a, b) => a.order - b.order));
            info([
                { ru },
                { rs },
                { rd },
                { rn },
                { rp },
                { iu },
                { is },
                { id },
                { iN },
                { ip },
            ]);
            const square = [
                {
                    realItems: ru,
                    impliedItems: iu,
                    field: getFieldInHier("up"),
                },
                {
                    realItems: rs,
                    impliedItems: is,
                    field: getFieldInHier("same"),
                },
                {
                    realItems: rd,
                    impliedItems: id,
                    field: getFieldInHier("down"),
                },
                {
                    realItems: rn,
                    impliedItems: iN,
                    field: getFieldInHier("next"),
                },
                {
                    realItems: rp,
                    impliedItems: ip,
                    field: getFieldInHier("prev"),
                },
            ];
            return squareDirectionsOrder.map((order) => square[order]);
        });
    }
    async draw() {
        try {
            const { contentEl, db, plugin } = this;
            db.start2G("Draw Matrix View");
            contentEl.empty();
            const { userHiers } = plugin.settings;
            const currFile = getCurrFile();
            if (!currFile)
                return;
            const hierSquares = this.getHierSquares(userHiers, currFile).filter((squareArr) => squareArr.some((sq) => sq.realItems.length + sq.impliedItems.length > 0));
            new Matrix({
                target: contentEl,
                props: { hierSquares, matrixView: this, currFile },
            });
            db.end2G();
        }
        catch (err) {
            error(err);
            this.db.end2G();
        }
    }
}
//# sourceMappingURL=MatrixView.js.map