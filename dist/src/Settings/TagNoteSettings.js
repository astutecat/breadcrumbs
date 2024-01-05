import { Setting } from "obsidian";
import { refreshIndex } from "../refreshIndex";
import { getFields } from "../Utils/HierUtils";
import { fragWithHTML, subDetails } from "./BreadcrumbsSettingTab";
export function addTagNoteSettings(plugin, alternativeHierarchyDetails) {
    const { settings } = plugin;
    const tagNoteDetails = subDetails("Tag Notes", alternativeHierarchyDetails);
    new Setting(tagNoteDetails)
        .setName("Default Tag Note Field")
        .setDesc(fragWithHTML("By default, tag notes use the first field in your hierarchies (usually an <code>↑</code> field). Choose a different one to use by default, without having to specify <code>BC-tag-note-field: {field}</code>.</br>If you don't want to choose a default, select the blank option at the bottom of the list."))
        .addDropdown((dd) => {
        const options = {};
        getFields(settings.userHiers).forEach((field) => (options[field] = field));
        dd.addOptions(Object.assign(options, { "": "" }))
            .setValue(settings.tagNoteField)
            .onChange(async (field) => {
            settings.tagNoteField = field;
            await plugin.saveSettings();
            await refreshIndex(plugin);
        });
    });
}
//# sourceMappingURL=TagNoteSettings.js.map