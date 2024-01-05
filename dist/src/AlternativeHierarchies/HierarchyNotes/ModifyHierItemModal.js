import { Modal } from "obsidian";
import ModifyHNItemComp from "../../Components/ModifyHNItemComp.svelte";
export class ModifyHierItemModal extends Modal {
    constructor(plugin, hnItem, file, rel) {
        super(app);
        this.plugin = plugin;
        this.modal = this;
        this.hnItem = hnItem;
        this.file = file;
        this.rel = rel;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.mount = new ModifyHNItemComp({
            target: contentEl,
            props: {
                modal: this,
                settings: this.plugin.settings,
                hnItem: this.hnItem,
                file: this.file,
                rel: this.rel,
            },
        });
    }
    onClose() {
        this.mount.$destroy();
        this.contentEl.empty();
    }
}
//# sourceMappingURL=ModifyHierItemModal.js.map