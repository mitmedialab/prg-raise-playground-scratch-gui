/**
 * Things a tour step can wait for the user to do (`waitFor` in an extension's tutorial.json).
 * Kept free of any browser or driver.js dependencies so it can be tested on its own.
 */

import fullBlockType from './block-types';

const noop = () => {};

// The kinds of workspace change events that can put a block into the code area
const BLOCK_EDIT_EVENTS = ['create', 'move', 'change', 'delete'];

/**
 * The kinds of conditions a step can wait for (`waitFor` in tutorial.json, see `TutorialCondition`).
 * Each one starts listening for its condition, calls `onMet` once it is true (possibly right away,
 * possibly more than once), and returns a function that stops listening.
 */
// Whether a block is nested inside a block of the given type
// (in a C block's mouth, or in an input like an "if"'s condition)
const isInside = (block, type) => {
    for (let parent = block.getParent(); parent; parent = parent.getParent()) {
        if (parent.type === type) return true;
    }
    return false;
};

// Whether a block of the given type is somewhere below this one in the same stack
const hasBelow = (block, type) => {
    for (let next = block.getNextBlock(); next; next = next.getNextBlock()) {
        if (next.type === type) return true;
    }
    return false;
};

const watchers = {
    // The user has dragged one of this extension's blocks into the code area, and (if the condition asks for it)
    // attached it to the right block: `inside` a block of that type, or `onTopOf` a block of that type
    blockPlaced: ({block, inside, onTopOf}, {extensionId, workspace, onMet}) => {
        const type = fullBlockType(extensionId, block);
        const isInRightPlace = placed =>
            (!inside || isInside(placed, inside)) && (!onTopOf || hasBelow(placed, onTopOf));
        // The main workspace only contains the blocks in the code area (the palette is a separate workspace)
        const isPlaced = () => workspace.getAllBlocks(false)
            .some(placed => placed.type === type && isInRightPlace(placed));
        if (isPlaced()) {
            onMet();
            return noop;
        }
        const listener = event => {
            if (BLOCK_EDIT_EVENTS.includes(event.type) && isPlaced()) onMet();
        };
        workspace.addChangeListener(listener);
        return () => workspace.removeChangeListener(listener);
    },
    // A script that contains one of this extension's blocks has started running: its hat fired, or the user clicked
    // the green flag or the script. (We can't use the project starting to run for this: while a project has an
    // edge-activated hat in it, the VM treats it as running all the time, so that event wouldn't fire again.)
    scriptRun: ({block}, {extensionId, workspace, vm, onMet}) => {
        const type = fullBlockType(extensionId, block);
        // The VM announces a script glowing (that is, running) when it starts, with the id of the script's top block.
        // Scripts in the palette are announced too (when clicked there), but they aren't in the main workspace.
        const listener = ({id}) => {
            const top = workspace.getBlockById(id);
            if (top && top.getDescendants(false).some(inScript => inScript.type === type)) onMet();
        };
        vm.runtime.on('SCRIPT_GLOW_ON', listener);
        return () => vm.runtime.off('SCRIPT_GLOW_ON', listener);
    }
};

/**
 * Watches a step's conditions, one after the other: a condition only counts once the one before it has been met.
 * (So clicking the green flag before building anything doesn't count.)
 * @param {Array.<object>} conditions The step's `waitFor`
 * @param {object} context What the watchers need: `extensionId`, `workspace`, `vm`
 * @param {function(number): void} onProgress Called with how many conditions have been met so far
 * @returns {function(): void} Stops watching
 */
const watchConditions = (conditions, context, onProgress) => {
    const stops = [];
    let disposed = false;

    const watch = index => {
        let met = false;
        let stop = null;
        const onMet = () => {
            if (met || disposed) return;
            met = true;
            if (stop) stop();
            onProgress(index + 1);
            if (index + 1 < conditions.length) watch(index + 1);
        };
        stop = watchers[conditions[index].type]?.(conditions[index], {...context, onMet}) ?? noop;
        // Some conditions are already met when we start watching, before we had a way to stop them
        if (met) stop();
        else stops.push(stop);
    };

    if (conditions.length > 0) watch(0);
    return () => {
        disposed = true;
        stops.forEach(stop => stop());
    };
};

export default watchConditions;
