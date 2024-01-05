import UserHierarchies from "../Components/UserHierarchies.svelte";
import { details } from "./BreadcrumbsSettingTab";
export function addHierarchySettings(plugin, containerEl) {
    const fieldDetails = details("Hierarchies", containerEl);
    fieldDetails.createEl("p", {
        text: "Here you can set up different hierarchies you use in your vault. To add a new hierarchy, click the plus button. Then, fill in the field names of your hierachy into the 5 boxes that appear.",
    });
    fieldDetails.createEl("p", {
        text: "For each direction, you can enter multiple field names in a comma-seperated list. For example: `parent, broader, upper`",
    });
    new UserHierarchies({
        target: fieldDetails,
        props: { plugin },
    });
}
//# sourceMappingURL=HierarchySettings.js.map