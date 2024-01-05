import { Setting } from "obsidian";
import { refreshIndex } from "../refreshIndex";
import { splitAndTrim } from "../Utils/generalUtils";
import { getFields } from "../Utils/HierUtils";
import { fragWithHTML, subDetails } from "./BreadcrumbsSettingTab";
export function addHierarchyNoteSettings(plugin, alternativeHierarchyDetails) {
    const { settings } = plugin;
    const hierarchyNoteDetails = subDetails("Hierarchy Notes", alternativeHierarchyDetails);
    new Setting(hierarchyNoteDetails)
        .setName("Hierarchy Note(s)")
        .setDesc(fragWithHTML("A comma-separated list of notes used to create external Breadcrumb structures.<br>You can also point to a <em>folder</em> of hierarchy notes by entering <code>folderName/</code> (ending with a <code>/</code>).<br>Hierarchy note names and folders of hierarchy notes can both be entered in the same comma-separated list."))
        .addText((text) => {
        text
            .setPlaceholder("Hierarchy Note(s)")
            .setValue(settings.hierarchyNotes.join(", "));
        text.inputEl.onblur = async () => {
            const splits = splitAndTrim(text.getValue());
            settings.hierarchyNotes = splits;
            await plugin.saveSettings();
        };
    });
    new Setting(hierarchyNoteDetails)
        .setName('Hierarchy note is parent of top-level items')
        .setDesc('Should the actual hierarchy note be treated as the parent of all the top-level items in the list? ✅ = Yes, ❌ = No')
        .addToggle((toggle) => {
        toggle
            .setValue(settings.hierarchyNoteIsParent)
            .onChange(async (value) => {
            settings.hierarchyNoteIsParent = value;
            await plugin.saveSettings();
            await refreshIndex(plugin);
        });
    });
    new Setting(hierarchyNoteDetails)
        .setName("Default Hierarchy Note Field")
        .setDesc(fragWithHTML("By default, hierarchy notes use the first <code>up</code> field in your hierarchies. Choose a different one to use by default. If you don't want to choose a default, select the blank option at the bottom of the list."))
        .addDropdown((dd) => {
        const upFields = getFields(settings.userHiers, "up");
        const options = {};
        upFields.forEach((field) => (options[field] = field));
        dd.addOptions(options)
            .setValue(settings.HNUpField || upFields[0])
            .onChange(async (field) => {
            settings.HNUpField = field;
            await plugin.saveSettings();
            await refreshIndex(plugin);
        });
    });
}
//# sourceMappingURL=HierarchyNoteSettings.js.map