import { error, info } from "loglevel";
import { MarkdownView } from "obsidian";
import NextPrev from "../Components/NextPrev.svelte";
import TrailGrid from "../Components/TrailGrid.svelte";
import TrailPath from "../Components/TrailPath.svelte";
import { BC_HIDE_TRAIL, blankRealNImplied, JUGGL_TRAIL_DEFAULTS, TRAIL_LENGTHS, } from "../constants";
import { bfsAllPaths, getReflexiveClosure, getSubForFields, getSubInDirs, } from "../Utils/graphUtils";
import { getFields, getOppDir, getOppFields } from "../Utils/HierUtils";
import { createJugglTrail } from "../Visualisations/Juggl";
function getLimitedTrailSub(plugin) {
    const { settings, mainG, closedG } = plugin;
    const { limitTrailCheckboxes, userHiers } = settings;
    if (getFields(userHiers).every((field) => limitTrailCheckboxes.includes(field))) {
        return getSubInDirs(closedG, "up");
    }
    else {
        const oppFields = limitTrailCheckboxes
            .map((field) => { var _a; return (_a = getOppFields(userHiers, field, "up")) === null || _a === void 0 ? void 0 : _a[0]; })
            .filter((field) => field !== undefined);
        const subGraph = getSubForFields(mainG, [
            ...limitTrailCheckboxes,
            ...oppFields,
        ]);
        const closed = getReflexiveClosure(subGraph, userHiers);
        return getSubInDirs(closed, "up");
    }
}
function getBreadcrumbs(settings, g, currFile) {
    const { basename, extension } = currFile;
    if (extension !== "md")
        return null;
    const allTrails = bfsAllPaths(g, basename);
    let filteredTrails = [...allTrails];
    const { indexNotes, showAllPathsIfNoneToIndexNote } = settings;
    // Filter for index notes
    if (
    // Works for `undefined` and `""`
    indexNotes[0] &&
        filteredTrails.length) {
        filteredTrails = filteredTrails.filter((trail) => indexNotes.includes(trail[0]));
        if (filteredTrails.length === 0 && showAllPathsIfNoneToIndexNote)
            filteredTrails = [...allTrails];
    }
    const sortedTrails = filteredTrails
        .filter((trail) => trail.length > 0)
        .sort((a, b) => a.length - b.length);
    return sortedTrails;
}
function getNextNPrev(plugin, currNode) {
    const { mainG } = plugin;
    const { userHiers } = plugin.settings;
    if (!mainG)
        return null;
    const nextNPrev = blankRealNImplied();
    mainG.forEachEdge(currNode, (k, a, s, t) => {
        const { dir, field, implied } = a;
        if (dir !== "next" && dir !== "prev")
            return;
        if (s === currNode) {
            nextNPrev[dir].reals.push({ field, to: t, implied });
        }
        else {
            const oppField = getOppFields(userHiers, field, dir)[0];
            nextNPrev[getOppDir(dir)].implieds.push({
                field: oppField,
                to: s,
                implied,
            });
        }
    });
    return nextNPrev;
}
export function getTrailLength(curr, offset = 1) {
    const index = (TRAIL_LENGTHS.indexOf(curr) + offset) % TRAIL_LENGTHS.length;
    return TRAIL_LENGTHS[index < 0 ? TRAIL_LENGTHS.length + index : index];
}
export async function drawTrail(plugin) {
    var _a, _b, _c, _d;
    try {
        const { settings, db, mainG } = plugin;
        const { showBCs, noPathMessage, respectReadableLineLength, showTrail, showGrid, showJuggl, showPrevNext, showBCsInEditLPMode, } = settings;
        db.start2G("drawTrail");
        const activeMDView = app.workspace.getActiveViewOfType(MarkdownView);
        const mode = activeMDView === null || activeMDView === void 0 ? void 0 : activeMDView.getMode();
        if (!showBCs ||
            !activeMDView ||
            (mode !== "preview" && !showBCsInEditLPMode)) {
            (_a = activeMDView === null || activeMDView === void 0 ? void 0 : activeMDView.containerEl.querySelector(".BC-trail")) === null || _a === void 0 ? void 0 : _a.remove();
            return db.end2G();
        }
        const { file } = activeMDView;
        const { frontmatter } = (_b = app.metadataCache.getFileCache(file)) !== null && _b !== void 0 ? _b : {};
        if ((frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter[BC_HIDE_TRAIL]) || (frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter["kanban-plugin"]))
            return db.end2G();
        const { basename } = file;
        if (!mainG.hasNode(basename))
            return db.end2G();
        const view = mode === "preview"
            ? activeMDView.previewMode.containerEl.querySelector("div.markdown-preview-view")
            : activeMDView.contentEl.querySelector("div.markdown-source-view");
        (_c = activeMDView.containerEl
            .querySelectorAll(".BC-trail")) === null || _c === void 0 ? void 0 : _c.forEach((trail) => trail.remove());
        const closedUp = getLimitedTrailSub(plugin);
        const sortedTrails = getBreadcrumbs(settings, closedUp, file);
        info({ sortedTrails });
        const { next: { reals: rNext, implieds: iNext }, prev: { reals: rPrev, implieds: iPrev }, } = getNextNPrev(plugin, basename);
        // Remove duplicate implied
        const next = [...rNext];
        iNext.forEach((i) => {
            if (next.findIndex((n) => n.to === i.to) === -1)
                next.push(i);
        });
        const prev = [...rPrev];
        iPrev.forEach((i) => {
            if (prev.findIndex((n) => n.to === i.to) === -1)
                prev.push(i);
        });
        const noItems = !sortedTrails.length && !next.length && !prev.length;
        if (noItems && noPathMessage === "")
            return db.end2G();
        const selectorForMaxWidth = mode === "preview"
            ? ".markdown-preview-view.is-readable-line-width .markdown-preview-sizer"
            : "";
        const elForMaxWidth = selectorForMaxWidth !== ""
            ? document.querySelector(selectorForMaxWidth)
            : null;
        const max_width = elForMaxWidth
            ? getComputedStyle(elForMaxWidth).getPropertyValue("max-width")
            : "100%";
        const trailDiv = createDiv({
            cls: `BC-trail ${respectReadableLineLength
                ? "is-readable-line-width markdown-preview-sizer markdown-preview-section"
                : ""}`,
            attr: {
                style: (mode !== "preview" ? `max-width: ${max_width};` : "") +
                    "margin: 0 auto;" +
                    `${respectReadableLineLength
                        ? 'width: var(--file-line-width);'
                        : 'width: 100%'}`,
            },
        });
        plugin.visited.push([file.path, trailDiv]);
        if (mode === "preview") {
            view.querySelector("div.markdown-preview-sizer").before(trailDiv);
            // const banner = document.querySelector('.obsidian-banner-wrapper')
            // if (banner) {
            //   requestAnimationFrame(() => {
            //     const bannerMargin = getComputedStyle(banner).marginTop
            //     console.log(bannerMargin)
            //     trailDiv.style.marginTop = bannerMargin;
            //     banner.style.marginTop = '0px'
            //   })
            // }
        }
        else {
            const cmGutter = view.querySelector("div.cm-gutters");
            if (cmGutter) {
                requestAnimationFrame(() => {
                    const gutterHeight = trailDiv.getBoundingClientRect().height;
                    // set padding top of gutter to match height of trailDiv
                    //@ts-ignore
                    cmGutter.style.paddingTop = `${gutterHeight + 4}px`;
                });
            }
            // const banner = document.querySelector('.obsidian-banner-spacer')
            // if (banner) {
            //   console.log({ banner })
            //   requestAnimationFrame(() => {
            //     const bannerMargin = parseInt(getComputedStyle(banner).height)
            //     console.log(bannerMargin)
            //     trailDiv.style.marginTop = `${bannerMargin + 10}px`;
            //     banner.style.height = '0px'
            //   })
            // }
            (_d = view.querySelector("div.cm-contentContainer")) === null || _d === void 0 ? void 0 : _d.before(trailDiv);
        }
        trailDiv.empty();
        if (settings.indexNotes.includes(basename)) {
            trailDiv.innerText = "Index Note";
            return db.end2G();
        }
        if (noItems) {
            trailDiv.innerText = noPathMessage;
            return db.end2G();
        }
        const targetProps = {
            target: trailDiv,
            props: { sortedTrails, plugin },
        };
        if (showTrail && sortedTrails.length)
            new TrailPath(targetProps);
        if (showGrid && sortedTrails.length)
            new TrailGrid(targetProps);
        if (showPrevNext && (next.length || prev.length)) {
            new NextPrev({
                target: trailDiv,
                props: { plugin, next, prev },
            });
        }
        if (showJuggl && sortedTrails.length) {
            createJugglTrail(plugin, trailDiv, sortedTrails, basename, JUGGL_TRAIL_DEFAULTS);
        }
        db.end2G();
    }
    catch (err) {
        error(err);
        plugin.db.end2G();
    }
}
//# sourceMappingURL=TrailView.js.map