import { Setting } from "obsidian";
import { ALLUNLINKED, REAlCLOSED, RELATIONS, VISTYPES } from "../constants";
import { subDetails } from "./BreadcrumbsSettingTab";
export function addVisModalSettings(plugin, viewDetails) {
    const { settings } = plugin;
    const visModalDetails = subDetails("Visualisation Modal", viewDetails);
    new Setting(visModalDetails)
        .setName("Default Visualisation Type")
        .setDesc("Which visualisation to show by default")
        .addDropdown((cb) => {
        VISTYPES.forEach((option) => {
            cb.addOption(option, option);
        });
        cb.setValue(settings.visGraph);
        cb.onChange(async (value) => {
            settings.visGraph = value;
            await plugin.saveSettings();
        });
    });
    new Setting(visModalDetails)
        .setName("Default Relation")
        .setDesc("Which relation type to show first when opening the modal")
        .addDropdown((dd) => {
        RELATIONS.forEach((option) => {
            dd.addOption(option, option);
        });
        dd.setValue(settings.visRelation);
        dd.onChange(async (value) => {
            settings.visRelation = value;
            await plugin.saveSettings();
        });
    });
    new Setting(visModalDetails)
        .setName("Default Real/Closed")
        .setDesc("Show the real or closed graph by default")
        .addDropdown((cb) => {
        REAlCLOSED.forEach((option) => {
            cb.addOption(option, option);
        });
        cb.setValue(settings.visClosed);
        cb.onChange(async (value) => {
            settings.visClosed = value;
            await plugin.saveSettings();
        });
    });
    new Setting(visModalDetails)
        .setName("Default Unlinked")
        .setDesc("Show all nodes or only those which have links by default")
        .addDropdown((cb) => {
        ALLUNLINKED.forEach((option) => {
            cb.addOption(option, option);
        });
        cb.setValue(settings.visAll);
        cb.onChange(async (value) => {
            settings.visAll = value;
            await plugin.saveSettings();
        });
    });
}
//# sourceMappingURL=VisModalSettings.js.map