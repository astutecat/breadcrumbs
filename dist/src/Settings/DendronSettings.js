import { Notice, Setting } from "obsidian";
import { refreshIndex } from "../refreshIndex";
import { DEFAULT_SETTINGS, MATRIX_VIEW } from "../constants";
import { getFields } from "../Utils/HierUtils";
import { fragWithHTML, subDetails } from "./BreadcrumbsSettingTab";
export function addDendronSettings(plugin, alternativeHierarchyDetails) {
    const { settings } = plugin;
    const { userHiers } = settings;
    const fields = getFields(userHiers);
    const dendronDetails = subDetails("Dendron Notes", alternativeHierarchyDetails);
    new Setting(dendronDetails)
        .setName("Add Dendron notes to graph")
        .setDesc(fragWithHTML("Dendron notes create a hierarchy using note names.</br><code>nmath.algebra</code> is a note about algebra, whose parent is <code>math</code>.</br><code>nmath.calculus.limits</code> is a note about limits whose parent is the note <code>math.calculus</code>, the parent of which is <code>math</code>."))
        .addToggle((toggle) => toggle.setValue(settings.addDendronNotes).onChange(async (value) => {
        settings.addDendronNotes = value;
        await plugin.saveSettings();
    }));
    new Setting(dendronDetails)
        .setName("Delimiter")
        .setDesc(fragWithHTML("Which delimiter should Breadcrumbs look for? The default is <code>.</code>."))
        .addText((text) => {
        text
            .setPlaceholder("Delimiter")
            .setValue(settings.dendronNoteDelimiter);
        text.inputEl.onblur = async () => {
            const value = text.getValue();
            if (value)
                settings.dendronNoteDelimiter = value;
            else {
                new Notice(`The delimiter can't be blank`);
                settings.dendronNoteDelimiter = DEFAULT_SETTINGS.dendronNoteDelimiter;
            }
            await plugin.saveSettings();
        };
    });
    new Setting(dendronDetails)
        .setName("Trim Dendron Note Names")
        .setDesc(fragWithHTML("When displaying a dendron note name, should it be trimmed to only show the last item in the chain?</br>e.g. <code>A.B.C</code> → <code>C</code>."))
        .addToggle((toggle) => toggle.setValue(settings.trimDendronNotes).onChange(async (value) => {
        settings.trimDendronNotes = value;
        await plugin.saveSettings();
        await plugin.getActiveTYPEView(MATRIX_VIEW).draw();
    }));
    new Setting(dendronDetails)
        .setName("Dendron Note Field")
        .setDesc("Which field should Breadcrumbs use for Dendron notes?")
        .addDropdown((dd) => {
        fields.forEach((field) => dd.addOption(field, field));
        dd.setValue(settings.dendronNoteField);
        dd.onChange(async (value) => {
            settings.dendronNoteField = value;
            await plugin.saveSettings();
            await refreshIndex(plugin);
        });
    });
}
//# sourceMappingURL=DendronSettings.js.map