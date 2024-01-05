import { FuzzySuggestModal, Notice } from "obsidian";
import { HierarchyNoteManipulator } from "./HierarchyNoteManipulator";
export class HierarchyNoteSelectorModal extends FuzzySuggestModal {
    constructor(plugin) {
        super(app);
        this.plugin = plugin;
        this.settings = this.plugin.settings;
    }
    onOpen() {
        this.setPlaceholder("HN Chooser");
        const { hierarchyNotes } = this.settings;
        if (hierarchyNotes.length === 0) {
            this.close();
            new Notice("No hierarchy notes found");
        }
        else if (hierarchyNotes.length === 1 &&
            !hierarchyNotes[0].endsWith("/")) {
            this.close();
            new HierarchyNoteManipulator(this.plugin, hierarchyNotes[0]).open();
        }
        else {
            super.onOpen();
        }
    }
    getItems() {
        const { hierarchyNotes } = this.settings;
        if (hierarchyNotes.length == 1 && hierarchyNotes[0].endsWith("/")) {
            // this is a folder
            let folder = hierarchyNotes[0].slice(0, -1);
            if (app.plugins.plugins.dataview != undefined) {
                let pages = app.plugins.plugins.dataview.api.pages(`"${folder}"`);
                return pages.values.map((page) => page.file.path);
            }
            else {
                new Notice("make sure you have dataview enabled");
            }
        }
        else
            return hierarchyNotes;
    }
    getItemText(item) {
        return `${item}`;
    }
    renderSuggestion(item, el) {
        super.renderSuggestion(item, el);
    }
    onChooseItem(item, evt) {
        new HierarchyNoteManipulator(this.plugin, item).open();
        this.close();
    }
}
//# sourceMappingURL=HierNoteModal.js.map