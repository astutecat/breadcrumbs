import { EditorSuggest, } from "obsidian";
import { isInsideYaml } from "./Utils/ObsidianUtils";
import { escapeRegex } from "./Utils/generalUtils";
import { getFields } from "./Utils/HierUtils";
export class RelationSuggestor extends EditorSuggest {
    constructor(plugin) {
        super(app);
        this.getSuggestions = (context) => {
            const { query } = context;
            const { userHiers } = this.plugin.settings;
            return getFields(userHiers).filter((sug) => sug.includes(query));
        };
        this.plugin = plugin;
    }
    onTrigger(cursor, editor, _) {
        var _a;
        const trig = this.plugin.settings.relSuggestorTrigger;
        const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
        const regex = new RegExp(`.*?${escapeRegex(trig)}(.*)$`);
        const match = (_a = regex.exec(sub)) === null || _a === void 0 ? void 0 : _a[1];
        if (match === undefined)
            return null;
        return {
            start: {
                ch: sub.lastIndexOf(trig),
                line: cursor.line,
            },
            end: cursor,
            query: match,
        };
    }
    renderSuggestion(suggestion, el) {
        el.createDiv({
            text: suggestion,
            cls: "codeblock-suggestion",
        });
    }
    selectSuggestion(suggestion) {
        const { context, plugin } = this;
        if (!context)
            return;
        const trig = plugin.settings.relSuggestorTrigger;
        const { start, end, editor } = context;
        const replacement = suggestion + (isInsideYaml() ? ": " : ":: ") + '[[';
        editor.replaceRange(replacement, { ch: start.ch + 1 - trig.length, line: start.line }, end);
    }
}
//# sourceMappingURL=RelationSuggestor.js.map