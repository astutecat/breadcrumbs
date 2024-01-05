import { error, info } from "loglevel";
import { FuzzySuggestModal, MarkdownView, Notice, } from "obsidian";
import { dropWikilinks } from "../../Utils/ObsidianUtils";
import { ModifyHierItemModal } from "./ModifyHierItemModal";
export class HierarchyNoteManipulator extends FuzzySuggestModal {
    constructor(plugin, hierNoteName) {
        super(app);
        this.plugin = plugin;
        this.settings = this.plugin.settings;
        this.hierNoteName = hierNoteName;
        const chooseOverride = (evt) => {
            // @ts-ignore
            this.chooser.useSelectedItem(evt);
            return false;
        };
        this.scope.register([], "Delete", chooseOverride);
        this.scope.register(["Shift"], "ArrowUp", chooseOverride);
        this.scope.register(["Shift"], "ArrowRight", chooseOverride);
        this.scope.register(["Shift"], "ArrowDown", chooseOverride);
    }
    async onOpen() {
        this.setPlaceholder("HN Manipulator");
        this.setInstructions([
            { command: "Shift + Enter", purpose: "Jump to item" },
            { command: "Shift + ↑", purpose: "Add parent" },
            { command: "Shift + →", purpose: "Add sibling" },
            { command: "Shift + ↓ / Enter / Click", purpose: "Add child" },
            { command: "Delete", purpose: "Delete item" },
        ]);
        this.file = app.metadataCache.getFirstLinkpathDest(this.hierNoteName, "");
        if (!this.file)
            this.lines = [];
        console.log(this);
        const content = await app.vault.cachedRead(this.file);
        this.lines = content.split("\n");
        this.listItems = app.metadataCache.getFileCache(this.file).listItems;
        console.log(this);
        super.onOpen();
    }
    getItems() {
        const items = this.listItems
            .map((item) => {
            const i = item.position.start.line;
            return { i, line: this.lines[i] };
        })
            .map((item) => {
            const splits = item.line.split("- ");
            const depth = splits[0].length;
            const line = splits.slice(1).join("- ");
            return { depth, line, lineNo: item.i };
        });
        info(items);
        return items;
    }
    getItemText(item) {
        return `${" ".repeat(item.depth)}- ${dropWikilinks(item.line)}`;
    }
    renderSuggestion(item, el) {
        super.renderSuggestion(item, el);
        el.innerText = `${" ".repeat(item.item.depth)}- ${dropWikilinks(item.item.line)}`;
    }
    async deleteItem(item) {
        try {
            this.lines.splice(item.lineNo, 1);
            this.listItems.splice(item.lineNo, 1);
            await app.vault.modify(this.file, this.lines.join("\n"));
            new Notice("Item deleted Succesfully");
        }
        catch (err) {
            error(err);
            new Notice("An error occured. Please check the console");
        }
    }
    onChooseItem(item, evt) {
        if (evt instanceof KeyboardEvent && evt.key === "Delete") {
            this.deleteItem(item);
        }
        else if (evt instanceof KeyboardEvent &&
            evt.key == "Enter" &&
            evt.shiftKey) {
            const view = app.workspace.getActiveViewOfType(MarkdownView);
            const { editor } = view !== null && view !== void 0 ? view : {};
            if (!editor)
                return;
            //@ts-ignore
            view.leaf.openFile(this.file, { active: true, mode: "source" });
            editor.setCursor({ line: item.lineNo, ch: item.depth + 2 });
        }
        else if (evt instanceof KeyboardEvent || evt instanceof MouseEvent) {
            let rel;
            if (evt instanceof MouseEvent && evt.type == "click")
                rel = "down";
            if (evt instanceof KeyboardEvent)
                if (evt.key === "Enter")
                    rel = "down";
            if (evt instanceof KeyboardEvent && evt.shiftKey) {
                if (evt.key === "ArrowUp")
                    rel = "up";
                if (evt.key === "ArrowDown")
                    rel = "down";
                if (evt.key === "ArrowRight")
                    rel = "same";
            }
            new ModifyHierItemModal(this.plugin, item, this.file, rel).open();
            this.close();
        }
    }
}
//# sourceMappingURL=HierarchyNoteManipulator.js.map