/**
 * Getting the code area ready for a tutorial. Kept free of any browser or driver.js dependencies (the question is
 * passed in) so that it can be tested on its own: it deletes people's work, so it should be.
 */

// eslint-disable-next-line no-alert
const askWithBrowserDialog = message => window.confirm(message);

/**
 * Deletes every script in the code area, as one action so that undoing brings them all back at once.
 * (Only the scripts: variables, and the other sprites, are left alone.)
 * @param {object} ScratchBlocks The scratch-blocks module
 * @param {object} workspace The (main) scratch-blocks workspace
 */
const clearCodeArea = (ScratchBlocks, workspace) => {
    ScratchBlocks.Events.setGroup(true);
    try {
        workspace.getTopBlocks(false).forEach(block => block.dispose(false));
    } finally {
        ScratchBlocks.Events.setGroup(false);
    }
};

/**
 * A tutorial step that sets up blocks needs an empty code area, so if the sprite already has scripts, asks whether
 * to delete them first. Nothing is deleted unless the user says yes. If they say no, nothing changes and the caller
 * should hold off going into the step.
 * @param {object} options Options
 * @param {object} options.ScratchBlocks The scratch-blocks module
 * @param {object} options.workspace The (main) scratch-blocks workspace
 * @param {object} options.vm The virtual machine (used to name the sprite)
 * @param {function(string): boolean} [options.ask] How to ask the user a yes or no question (the browser's by default)
 * @returns {boolean} True if the code area is empty now (it was, or the user agreed to clear it), false if the user
 *     said no
 */
const prepareCodeArea = ({ScratchBlocks, workspace, vm, ask = askWithBrowserDialog}) => {
    const scripts = workspace.getTopBlocks(false).filter(block => !block.isShadow());
    if (scripts.length === 0) return true;

    const sprite = vm.editingTarget?.getName();
    const whose = sprite ? `\u201c${sprite}\u201d` : 'this sprite';
    const count = scripts.length === 1 ? 'a script' : `${scripts.length} scripts`;
    const deleteThem = ask(
        `${whose} already has ${count} in its code area.\n\n` +
        'The next step needs an empty code area.\n\n' +
        'Press OK to delete them and continue. Or press Cancel to stay on this step, and click Next again ' +
        'once you have cleared or moved them yourself.'
    );
    if (!deleteThem) return false;

    clearCodeArea(ScratchBlocks, workspace);
    return true;
};

export default prepareCodeArea;
