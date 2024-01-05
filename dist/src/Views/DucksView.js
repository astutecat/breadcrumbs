import { ItemView } from "obsidian";
import Ducks from "../Components/Ducks.svelte";
import { DUCK_ICON, DUCK_VIEW } from "../constants";
export default class DucksView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        // TODO Duck icon
        this.icon = DUCK_ICON;
        this.plugin = plugin;
    }
    async onload() {
        super.onload();
        await this.plugin.saveSettings();
        app.workspace.onLayoutReady(async () => {
            await this.draw();
        });
    }
    getViewType() {
        return DUCK_VIEW;
    }
    getDisplayText() {
        return "Breadcrumbs Ducks";
    }
    async onOpen() { }
    onClose() {
        var _a;
        (_a = this.view) === null || _a === void 0 ? void 0 : _a.$destroy();
        return Promise.resolve();
    }
    async draw() {
        this.contentEl.empty();
        this.view = new Ducks({
            target: this.contentEl,
            props: { plugin: this.plugin, ducksView: this },
        });
    }
}
//# sourceMappingURL=DucksView.js.map