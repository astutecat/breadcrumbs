import { getPlugin } from "juggl-api";
import { addIcon, MarkdownView, Plugin } from "obsidian";
import { addFeatherIcon, openView, wait, } from "obsidian-community-lib/dist/utils";
import { BCAPI } from "./API";
import { Debugger } from "src/Debugger";
import { HierarchyNoteSelectorModal } from "./AlternativeHierarchies/HierarchyNotes/HierNoteModal";
import { getCodeblockCB } from "./Codeblocks";
import { copyGlobalIndex, copyLocalIndex } from "./Commands/CreateIndex";
import { jumpToFirstDir } from "./Commands/jumpToFirstDir";
import { thread } from "./Commands/threading";
import { writeBCsToAllFiles, writeBCToFile } from "./Commands/WriteBCs";
import { DEFAULT_SETTINGS, DUCK_ICON, DUCK_ICON_SVG, DUCK_VIEW, MATRIX_VIEW, TRAIL_ICON, TRAIL_ICON_SVG, TREE_VIEW, API_NAME, } from "./constants";
import { FieldSuggestor } from "./FieldSuggestor";
import { buildClosedG, buildMainG, refreshIndex } from "./refreshIndex";
import { RelationSuggestor } from "./RelationSuggestor";
import { BCSettingTab } from "./Settings/BreadcrumbsSettingTab";
import { getFields } from "./Utils/HierUtils";
import { waitForCache } from "./Utils/ObsidianUtils";
import DucksView from "./Views/DucksView";
import MatrixView from "./Views/MatrixView";
import { drawTrail } from "./Views/TrailView";
import TreeView from "./Views/TreeView";
import { BCStore } from "./Visualisations/Juggl";
import { VisModal } from "./Visualisations/VisModal";
export default class BCPlugin extends Plugin {
    constructor() {
        super(...arguments);
        this.visited = [];
        this.activeLeafChange = undefined;
        this.layoutChange = undefined;
        this.loadSettings = async () => (this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
        this.saveSettings = async () => await this.saveData(this.settings);
    }
    registerActiveLeafChangeEvent() {
        this.activeLeafChange = app.workspace.on("file-open", async () => {
            if (this.settings.refreshOnNoteChange)
                await refreshIndex(this);
            else {
                const activeView = this.getActiveTYPEView(MATRIX_VIEW);
                if (activeView)
                    await activeView.draw();
            }
        });
        this.registerEvent(this.activeLeafChange);
    }
    registerLayoutChangeEvent() {
        this.layoutChange = app.workspace.on("layout-change", async () => {
            if (this.settings.showBCs)
                await drawTrail(this);
        });
        this.registerEvent(this.layoutChange);
    }
    async onload() {
        console.log("loading breadcrumbs plugin");
        await this.loadSettings();
        this.addSettingTab(new BCSettingTab(this));
        this.db = new Debugger(this);
        const { settings } = this;
        const { fieldSuggestor, enableRelationSuggestor, openMatrixOnLoad, openDuckOnLoad, openDownOnLoad, showBCs, userHiers, } = settings;
        if (fieldSuggestor)
            this.registerEditorSuggest(new FieldSuggestor(this));
        if (enableRelationSuggestor)
            this.registerEditorSuggest(new RelationSuggestor(this));
        // Override older versions of these settings
        if (settings.limitTrailCheckboxes.length === 0)
            settings.limitTrailCheckboxes = getFields(settings.userHiers);
        if (typeof settings.showAll === 'boolean')
            settings.showAll = settings.showAll ? 'All' : 'Shortest';
        this.VIEWS = [
            {
                plain: "Matrix",
                type: MATRIX_VIEW,
                constructor: MatrixView,
                openOnLoad: openMatrixOnLoad,
            },
            {
                plain: "Duck",
                type: DUCK_VIEW,
                constructor: DucksView,
                openOnLoad: openDuckOnLoad,
            },
            {
                plain: "Down",
                type: TREE_VIEW,
                constructor: TreeView,
                openOnLoad: openDownOnLoad,
            },
        ];
        for (const { constructor, type } of this.VIEWS) {
            this.registerView(type, (leaf) => 
            //@ts-ignore
            new constructor(leaf, this));
        }
        addIcon(DUCK_ICON, DUCK_ICON_SVG);
        addIcon(TRAIL_ICON, TRAIL_ICON_SVG);
        // addRibbonIcon must be before waitForCache(this); Otherwise the Ribbon configuration in Appearance/Ribbon menu/Manage is lost at every restart
        this.addRibbonIcon(addFeatherIcon("tv"), "Breadcrumbs Visualisation", () => new VisModal(this).open());
        await waitForCache(this);
        this.mainG = await buildMainG(this);
        this.closedG = buildClosedG(this);
        app.workspace.onLayoutReady(async () => {
            var _a;
            const noFiles = app.vault.getMarkdownFiles().length;
            if (((_a = this.mainG) === null || _a === void 0 ? void 0 : _a.nodes().length) < noFiles) {
                await wait(3000);
                this.mainG = await buildMainG(this);
                this.closedG = buildClosedG(this);
            }
            for (const { openOnLoad, type, constructor } of this.VIEWS)
                if (openOnLoad)
                    await openView(type, constructor);
            if (showBCs)
                await drawTrail(this);
            this.registerActiveLeafChangeEvent();
            this.registerLayoutChangeEvent();
            // Source for save setting
            // https://github.com/hipstersmoothie/obsidian-plugin-prettier/blob/main/src/main.ts
            const saveCommandDefinition = app.commands.commands["editor:save-file"];
            const save = saveCommandDefinition === null || saveCommandDefinition === void 0 ? void 0 : saveCommandDefinition.callback;
            if (typeof save === "function") {
                saveCommandDefinition.callback = async () => {
                    await save();
                    if (this.settings.refreshOnNoteSave) {
                        await refreshIndex(this);
                        const activeView = this.getActiveTYPEView(MATRIX_VIEW);
                        if (activeView)
                            await activeView.draw();
                    }
                };
            }
            app.workspace.iterateAllLeaves((leaf) => {
                if (leaf instanceof MarkdownView)
                    //@ts-ignore
                    leaf.view.previewMode.rerender(true);
            });
        });
        for (const { type, plain, constructor } of this.VIEWS) {
            this.addCommand({
                id: `show-${type}-view`,
                name: `Open ${plain} View`,
                //@ts-ignore
                checkCallback: async (checking) => {
                    if (checking)
                        return app.workspace.getLeavesOfType(type).length === 0;
                    await openView(type, constructor);
                },
            });
        }
        this.addCommand({
            id: "open-vis-modal",
            name: "Open Visualisation Modal",
            callback: () => new VisModal(this).open(),
        });
        this.addCommand({
            id: "manipulate-hierarchy-notes",
            name: "Adjust Hierarchy Notes",
            callback: () => new HierarchyNoteSelectorModal(this).open(),
        });
        this.addCommand({
            id: "Refresh-Breadcrumbs-Index",
            name: "Refresh Breadcrumbs Index",
            callback: async () => await refreshIndex(this),
        });
        this.addCommand({
            id: "Toggle-trail-in-Edit&LP",
            name: "Toggle: Show Trail/Grid in Edit & LP mode",
            callback: async () => {
                settings.showBCsInEditLPMode = !settings.showBCsInEditLPMode;
                await this.saveSettings();
                await drawTrail(this);
            },
        });
        this.addCommand({
            id: "Write-Breadcrumbs-to-Current-File",
            name: "Write Breadcrumbs to Current File",
            callback: async () => await writeBCToFile(this),
        });
        this.addCommand({
            id: "Write-Breadcrumbs-to-All-Files",
            name: "Write Breadcrumbs to **ALL** Files",
            callback: async () => await writeBCsToAllFiles(this),
        });
        this.addCommand({
            id: "local-index",
            name: "Copy a Local Index to the clipboard",
            callback: async () => await copyLocalIndex(this),
        });
        this.addCommand({
            id: "global-index",
            name: "Copy a Global Index to the clipboard",
            callback: async () => await copyGlobalIndex(this),
        });
        ["up", "down", "next", "prev"].forEach((dir) => {
            this.addCommand({
                id: `jump-to-first-${dir}`,
                name: `Jump to first '${dir}'`,
                callback: async () => await jumpToFirstDir(this, dir),
            });
        });
        getFields(userHiers).forEach((field) => {
            this.addCommand({
                id: `new-file-with-curr-as-${field}`,
                name: `Create a new '${field}' from the current note`,
                callback: async () => await thread(this, field),
            });
        });
        this.registerMarkdownCodeBlockProcessor("breadcrumbs", getCodeblockCB(this));
        const jugglPlugin = getPlugin(app);
        if (jugglPlugin) {
            this.bcStore = new BCStore(this.mainG, app.metadataCache);
            jugglPlugin.registerStore(this.bcStore);
        }
        this.api = new BCAPI(this);
        // Register API to global window object.
        (window[API_NAME] = this.api) &&
            this.register(() => delete window[API_NAME]);
    }
    getActiveTYPEView(type) {
        const { constructor } = this.VIEWS.find((view) => view.type === type);
        const leaves = app.workspace.getLeavesOfType(type);
        if (leaves && leaves.length >= 1) {
            const { view } = leaves[0];
            if (view instanceof constructor)
                return view;
        }
        return null;
    }
    onunload() {
        console.log("unloading");
        this.VIEWS.forEach(async (view) => {
            app.workspace.getLeavesOfType(view.type).forEach((leaf) => {
                leaf.detach();
            });
        });
        this.visited.forEach((visit) => visit[1].remove());
        if (this.bcStore) {
            const jugglPlugin = getPlugin(app);
            if (jugglPlugin) {
                // @ts-ignore
                jugglPlugin.removeStore(this.bcStore);
            }
        }
    }
}
//# sourceMappingURL=main.js.map