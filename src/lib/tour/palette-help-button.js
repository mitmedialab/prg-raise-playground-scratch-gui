/**
 * A small "?" button beside an extension's title at the top of its blocks in the palette.
 * Clicking it starts the extension's guided tour (for extensions that have one).
 *
 * The palette's titles are drawn by scratch-blocks, which is an installed package rather than code we can edit, so
 * this adds to them from the outside: it wraps the functions that draw a category's title. What the button does is
 * decided by `ScratchBlocks.extensionTour`, which the editor sets:
 *   {has(extensionId): boolean, start(extensionId): void}
 */

const HELP_BUTTON_CLASS = 'prgTourHelp';
const HELP_BUTTON_LABEL = 'Learn how to use this extension';
const HELP_BUTTON_RADIUS = 10;
// Space between the end of the title and the button
const GAP_AFTER_TITLE = 10;

/**
 * Draws the button next to a category's title, if its extension has a tour.
 * @param {object} ScratchBlocks The scratch-blocks module
 * @param {object} title The palette item that draws the category's title (a Blockly.FlyoutButton)
 */
const addHelpButton = (ScratchBlocks, title) => {
    const extensionId = title.categoryId_;
    if (!title.isCategoryLabel_ || !extensionId || !title.svgGroup_) return;
    if (!ScratchBlocks.extensionTour?.has(extensionId)) return;

    const {createSvgElement} = ScratchBlocks.utils;
    // `width` is the width of the title's text, and the title is as tall as `height`
    const centerX = title.width + GAP_AFTER_TITLE + HELP_BUTTON_RADIUS;
    const centerY = title.height / 2;

    const button = createSvgElement('g', {
        'class': HELP_BUTTON_CLASS,
        'role': 'button',
        'aria-label': HELP_BUTTON_LABEL
    }, title.svgGroup_);
    createSvgElement('title', {}, button).textContent = HELP_BUTTON_LABEL; // The tooltip
    createSvgElement('circle', {cx: centerX, cy: centerY, r: HELP_BUTTON_RADIUS}, button);
    const mark = createSvgElement('text', {
        'x': centerX,
        'y': centerY,
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
    }, button);
    mark.textContent = '?';

    ScratchBlocks.bindEventWithChecks_(button, 'mouseup', title, event => {
        // Like the palette's own buttons: ignore the click if it was really the end of a drag
        const gesture = title.targetWorkspace_.getGesture(event);
        if (gesture) {
            if (gesture.isDragging()) return;
            gesture.cancel();
        }
        ScratchBlocks.extensionTour.start(extensionId);
    });
};

/**
 * Adds the "?" button to the palette titles of extensions that have a tour. Safe to call more than once.
 * @param {object} ScratchBlocks The scratch-blocks module
 */
const installPaletteHelpButton = ScratchBlocks => {
    const {FlyoutButton, FlyoutExtensionCategoryHeader} = ScratchBlocks;
    if (!FlyoutButton || FlyoutButton.prototype.hasHelpButtonSupport) return;
    FlyoutButton.prototype.hasHelpButtonSupport = true;

    // A title doesn't otherwise remember which category (extension) it is for
    const init = FlyoutButton.prototype.init;
    FlyoutButton.prototype.init = function (workspace, targetWorkspace, xml, isLabel) {
        init.call(this, workspace, targetWorkspace, xml, isLabel);
        this.categoryId_ = xml.getAttribute('id');
    };

    // Titles are drawn by two different classes: a plain one, and one for extensions with a status button
    [FlyoutButton, FlyoutExtensionCategoryHeader].filter(Boolean).forEach(titleClass => {
        const createDom = titleClass.prototype.createDom;
        titleClass.prototype.createDom = function () {
            const group = createDom.call(this);
            addHelpButton(ScratchBlocks, this);
            return group;
        };
    });
};

export default installPaletteHelpButton;
