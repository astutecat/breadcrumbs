import { EditorSuggest, } from "obsidian";
import { isInsideYaml } from "./Utils/ObsidianUtils";
import { BC_FIELDS_INFO } from "./constants";
export class FieldSuggestor extends EditorSuggest {
    constructor(plugin) {
        super(app);
        this.getSuggestions = (context) => {
            const { query } = context;
            return BC_FIELDS_INFO.map((sug) => sug.field).filter((sug) => sug.includes(query));
        };
        this.plugin = plugin;
    }
    onTrigger(cursor, editor, _) {
        var _a;
        const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
        const match = (_a = sub.match(/^BC-(.*)$/)) === null || _a === void 0 ? void 0 : _a[1];
        if (match !== undefined) {
            return {
                end: cursor,
                start: {
                    ch: sub.lastIndexOf(match),
                    line: cursor.line,
                },
                query: match,
            };
        }
        return null;
    }
    renderSuggestion(suggestion, el) {
        var _a;
        el.createDiv({
            text: suggestion.replace("BC-", ""),
            cls: "BC-suggester-container",
            attr: {
                "aria-label": (_a = BC_FIELDS_INFO.find((f) => f.field === suggestion)) === null || _a === void 0 ? void 0 : _a.desc,
                "aria-label-position": "right",
            },
        });
    }
    selectSuggestion(suggestion) {
        const { context, plugin } = this;
        if (!context)
            return;
        const field = BC_FIELDS_INFO.find((f) => f.field === suggestion);
        const replacement = `${suggestion}${field === null || field === void 0 ? void 0 : field[isInsideYaml() ? "afterYaml" : "afterInline"]}`;
        context.editor.replaceRange(replacement, { ch: 0, line: context.start.line }, context.end);
    }
}
//# sourceMappingURL=FieldSuggestor.js.map