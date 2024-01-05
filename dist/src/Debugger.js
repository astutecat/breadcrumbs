import { debug, info, levels } from "loglevel";
export class Debugger {
    constructor(plugin) {
        this.debugLessThan = (level) => levels[this.plugin.settings.debugMode] < level;
        this.plugin = plugin;
    }
    start2G(group) {
        if (this.debugLessThan(3))
            console.groupCollapsed(group);
    }
    end2G(...msgs) {
        if (this.debugLessThan(3)) {
            if (msgs.length)
                info(...msgs);
            console.groupEnd();
        }
    }
    start1G(group) {
        if (this.debugLessThan(2))
            console.groupCollapsed(group);
    }
    end1G(...msgs) {
        if (this.debugLessThan(2)) {
            if (msgs.length)
                debug(...msgs);
            console.groupEnd();
        }
    }
    startGs(...groups) {
        this.start2G(groups[0]);
        if (groups[1])
            this.start1G(groups[1]);
    }
    /**
     * End a debug and info group, logging `msgs` in `endDebugGroup`
     * @param  {1|2} count The number of groups to end. `1` ends Trace, 2 ends both
     * @param  {any[]} ...msgs
     */
    endGs(count, ...msgs) {
        if (count === 1)
            this.end2G(...msgs);
        else {
            this.end1G();
            this.end2G(...msgs);
        }
    }
}
//# sourceMappingURL=Debugger.js.map