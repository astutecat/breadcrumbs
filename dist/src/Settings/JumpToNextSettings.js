import Checkboxes from "../Components/Checkboxes.svelte";
import { getFields } from "../Utils/HierUtils";
import { subDetails } from "./BreadcrumbsSettingTab";
export function addJumpToNextSettings(plugin, viewDetails) {
    const { settings } = plugin;
    const jumpToDirDetails = subDetails("Jump to Next Direction", viewDetails);
    jumpToDirDetails.createDiv({ cls: 'setting-item-name', text: 'Limit which fields to jump to' });
    new Checkboxes({
        target: jumpToDirDetails,
        props: {
            plugin,
            settingName: "limitJumpToFirstFields",
            options: getFields(settings.userHiers),
        },
    });
}
//# sourceMappingURL=JumpToNextSettings.js.map