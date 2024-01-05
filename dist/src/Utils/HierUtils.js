import { ARROW_DIRECTIONS, DIRECTIONS } from "../constants";
/**
 * Get all the fields in `dir`.
 * Returns all fields if `dir === 'all'`
 * @param  {UserHier[]} userHiers
 * @param  {Directions|"all"} dir
 */
export function getFields(userHiers, dir = "all") {
    const fields = [];
    userHiers.forEach((hier) => {
        if (dir === "all") {
            DIRECTIONS.forEach((eachDir) => {
                fields.push(...hier[eachDir]);
            });
        }
        else {
            fields.push(...hier[dir]);
        }
    });
    return fields;
}
export const getOppDir = (dir) => {
    switch (dir) {
        case "up":
            return "down";
        case "down":
            return "up";
        case "same":
            return "same";
        case "next":
            return "prev";
        case "prev":
            return "next";
    }
};
/**
 *  Get the hierarchy and direction that `field` is in
 * */
export function getFieldInfo(userHiers, field) {
    let fieldDir;
    let fieldHier;
    DIRECTIONS.forEach((dir) => {
        userHiers.forEach((hier) => {
            if (hier[dir].includes(field)) {
                fieldDir = dir;
                fieldHier = hier;
                return;
            }
        });
    });
    return { fieldHier, fieldDir };
}
export function getOppFields(userHiers, field, dir) {
    // If the field ends with `>`, it is already the opposite field we need (coming from `getOppFallback`)
    if (field.endsWith(">"))
        return [field.slice(0, -4)];
    const oppFields = [fallbackOppField(field, dir)];
    const { fieldHier, fieldDir } = getFieldInfo(userHiers, field);
    if (!fieldHier || !fieldDir)
        return oppFields;
    const oppDir = getOppDir(fieldDir);
    oppFields.unshift(...fieldHier[oppDir]);
    return oppFields;
}
export const hierToStr = (hier) => DIRECTIONS.map((dir) => `${ARROW_DIRECTIONS[dir]}: ${hier[dir].join(", ")}`).join("\n");
export const fallbackField = (field, dir) => `${field} <${ARROW_DIRECTIONS[dir]}>`;
export const fallbackOppField = (field, dir) => `${field} <${ARROW_DIRECTIONS[getOppDir(dir)]}>`;
export function iterateHiers(userHiers, fn) {
    userHiers.forEach((hier) => {
        DIRECTIONS.forEach((dir) => {
            hier[dir].forEach((field) => {
                fn(hier, dir, field);
            });
        });
    });
}
//# sourceMappingURL=HierUtils.js.map