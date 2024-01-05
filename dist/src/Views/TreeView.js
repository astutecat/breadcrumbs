import { ItemView } from "obsidian";
import { addFeatherIcon } from "obsidian-community-lib";
import SideTree from "../Components/SideTree.svelte";
import { TREE_VIEW } from "../constants";
export default class TreeView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.icon = addFeatherIcon("corner-right-down");
        this.plugin = plugin;
    }
    async onload() {
        super.onload();
        app.workspace.onLayoutReady(async () => {
            await this.draw();
        });
    }
    getViewType() {
        return TREE_VIEW;
    }
    getDisplayText() {
        return "Breadcrumbs Down";
    }
    async onOpen() { }
    onClose() {
        var _a;
        (_a = this.view) === null || _a === void 0 ? void 0 : _a.$destroy();
        return Promise.resolve();
    }
    async draw() {
        this.contentEl.empty();
        this.view = new SideTree({
            target: this.contentEl,
            props: { plugin: this.plugin, view: this },
        });
    }
}
//# sourceMappingURL=TreeView.js.map