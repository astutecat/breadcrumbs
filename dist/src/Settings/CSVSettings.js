import { Setting } from "obsidian";
import { subDetails } from "./BreadcrumbsSettingTab";
export function addCSVSettings(plugin, alternativeHierarchyDetails) {
    const { settings } = plugin;
    const csvDetails = subDetails("CSV Notes", alternativeHierarchyDetails);
    new Setting(csvDetails)
        .setName("CSV Breadcrumb Paths")
        .setDesc("The file path of a csv files with breadcrumbs information.")
        .addText((text) => {
        text.setValue(settings.CSVPaths);
        text.inputEl.onblur = async () => {
            settings.CSVPaths = text.inputEl.value;
            await plugin.saveSettings();
        };
    });
}
//# sourceMappingURL=CSVSettings.js.map