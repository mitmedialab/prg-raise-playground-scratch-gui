// The lint import resolver doesn't understand driver.js's package `exports` map (webpack does)
import {driver} from 'driver.js'; // eslint-disable-line import/no-unresolved
// Loaded as a raw string (see webpack.config.js): driver.js needs its class names left alone,
// but all other css here goes through css modules.
import driverStyles from 'driver.js/dist/driver.css'; // eslint-disable-line import/no-unresolved
import './tour.css';
import watchConditions from './conditions';
import prepareCodeArea from './code-area';
import fullBlockType from './block-types';

/**
 * Guided tours of an extension, in the style of a product walkthrough:
 * the editor is dimmed, one part of it is spotlighted, and a popover explains it.
 *
 * Tours are authored by the extension (its `tutorial.json`, see `ExtensionTutorial` in the extension framework)
 * and arrive here through the extension's entry in the extension library (`tutorial`).
 */

const noop = () => {};

const DRIVER_STYLE_ID = 'prg-tour-driver-styles';
// Added to the page while a step is an activity (see `setUpActivity`), when the editor has to stay usable
const ACTIVITY_BODY_CLASS = 'prg-tour-activity';
// Added to the page while the tour is hidden because a window (like the extension library) is open on top of it
const PAUSED_BODY_CLASS = 'prg-tour-paused';
const TARGET_ATTRIBUTE = 'data-prg-tour-target';
const POPOVER_CLASS = 'prg-tour';

// The longest we'll wait for a target to stop moving (the palette scrolls with an animation)
const MAX_SETTLE_MS = 700;
// How many animation frames in a row a target must hold still to count as having stopped moving
const SETTLED_FRAMES = 3;

// While a tour is running, driver.js turns off pointer events for the whole page except the spotlight and popover.
const BLOCK_PAGE_RULE = '.driver-active .driver-overlay,.driver-active *{pointer-events:none}';
// The same rule, but not while a step is an activity or the tour is hidden behind a window
// (in both cases the user has to be able to click things).
// The condition is wrapped in :where() so it adds no specificity: driver.js relies on this rule tying with
// (and coming before) its `.driver-popover *` rule that keeps the popover clickable, so it must not outrank it.
const BLOCK_PAGE_UNLESS_ACTIVITY_RULE = BLOCK_PAGE_RULE
    .replace(/\.driver-active/g, `.driver-active:where(:not(.${ACTIVITY_BODY_CLASS}, .${PAUSED_BODY_CLASS}))`);

const ensureDriverStyles = () => {
    if (document.getElementById(DRIVER_STYLE_ID)) return;
    if (!driverStyles.includes(BLOCK_PAGE_RULE)) {
        // eslint-disable-next-line no-console
        console.warn('Extension tours: driver.js styles have changed, so activity steps will block the editor');
    }
    const style = document.createElement('style');
    style.id = DRIVER_STYLE_ID;
    style.textContent = driverStyles.replace(BLOCK_PAGE_RULE, BLOCK_PAGE_UNLESS_ACTIVITY_RULE);
    document.head.appendChild(style);
};

/**
 * Hides the tour while a window (like the extension library) is open on top of the editor, and shows it again after.
 * Otherwise the tour's popover, which sits above everything, would cover the window. While hidden it also stops
 * blocking the page, so the window can be used.
 * @param {boolean} paused True to hide the tour, false to show it again
 */
export const setTourPaused = paused => {
    document.body.classList.toggle(PAUSED_BODY_CLASS, paused);
};

const firstElement = selector => document.querySelector(selector);

// Class names of components styled with css modules are hashed, so match on the readable prefix instead
const uiElements = {
    'category': extensionId => firstElement(`.scratchCategoryId-${extensionId}`),
    'palette': () => firstElement('.blocklyFlyout'),
    'stage': () => firstElement('[class*="stage_stage_"]'),
    'green-flag': () => firstElement('[class*="green-flag_green-flag_"]'),
    'workspace': () => firstElement('[class*="gui_blocks-wrapper_"]')
};

// Which side of the spotlight the popover appears on
const uiSides = {
    'category': 'right',
    'palette': 'right',
    'stage': 'left',
    'green-flag': 'bottom',
    'workspace': 'over'
};

// Steps can pin their popover somewhere (`position` in tutorial.json), instead of placing it next to the step's target
const POSITION_CLASS_PREFIX = 'prg-tour-position-';
// Steps that ask the user to do something put their popover here, in the corner of the code area
const ACTIVITY_POSITION = 'workspace-bottom-right';
// Space between a popover pinned below the stage and the stage, and between it and the edges of the window
const PIN_GAP = 16;
// How far a popover pinned in the code area is from its edges. On the right it also needs to clear the zoom
// buttons, and at the bottom the scroll bar.
const WORKSPACE_MARGIN = 24;
const WORKSPACE_MARGIN_RIGHT = 80;
const WORKSPACE_MARGIN_BOTTOM = 40;

const positionOf = ({position, waitFor}) => position ?? (waitFor?.length > 0 ? ACTIVITY_POSITION : null);

/**
 * Pins a popover just below the stage, lined up with its left or right edge.
 * driver.js positions popovers with inline styles that we can't override from code, so we hand the measurements to
 * the stylesheet (tour.css) as css variables, and it does the pinning.
 * @param {Element} popoverElement The popover's outer element
 * @param {string} position Where to pin it: 'stage-bottom-left' or 'stage-bottom-right'
 */
const pinBelowStage = (popoverElement, position) => {
    const stage = uiElements.stage()?.getBoundingClientRect();
    const {width} = popoverElement.getBoundingClientRect();
    const alignedLeft = position === 'stage-bottom-left';

    const farthestLeft = window.innerWidth - width - PIN_GAP;
    // Without a stage to go by, fall back to the middle of the window's matching side
    let top = window.innerHeight / 2;
    let left = alignedLeft ? PIN_GAP : farthestLeft;
    if (stage) {
        top = stage.bottom + PIN_GAP;
        left = alignedLeft ? stage.left : stage.right - width;
    }
    left = Math.max(PIN_GAP, Math.min(left, farthestLeft));

    popoverElement.style.setProperty('--prg-tour-top', `${top}px`);
    popoverElement.style.setProperty('--prg-tour-left', `${left}px`);
    popoverElement.classList.add(`${POSITION_CLASS_PREFIX}${position}`);
};

/**
 * Pins a popover to a bottom corner of the code area: the part of the editor right of the palette and left of the
 * stage. Like `pinBelowStage`, this hands the measurements to the stylesheet (tour.css) as css variables.
 * @param {Element} popoverElement The popover's outer element
 * @param {string} position Which corner: 'workspace-bottom-left' or 'workspace-bottom-right'
 */
const pinToWorkspaceCorner = (popoverElement, position) => {
    const editor = document.querySelector('[class*="gui_blocks-wrapper_"]')?.getBoundingClientRect();
    const palette = document.querySelector('.blocklyFlyout')?.getBoundingClientRect();
    const left = palette?.right ?? editor?.left ?? 0;
    const right = editor?.right ?? window.innerWidth;
    const bottom = editor?.bottom ?? window.innerHeight;

    const {style} = popoverElement;
    style.setProperty('--prg-tour-left', `${left + WORKSPACE_MARGIN}px`);
    style.setProperty('--prg-tour-right', `${window.innerWidth - right + WORKSPACE_MARGIN_RIGHT}px`);
    style.setProperty('--prg-tour-bottom', `${window.innerHeight - bottom + WORKSPACE_MARGIN_BOTTOM}px`);
    popoverElement.classList.add(`${POSITION_CLASS_PREFIX}${position}`);
};

/**
 * Pins a popover in place (see `position` in `TutorialStep`).
 * @param {Element} popoverElement The popover's outer element
 * @param {string} position Where to pin it
 */
const pinPopover = (popoverElement, position) => {
    if (position.startsWith('stage-')) pinBelowStage(popoverElement, position);
    else pinToWorkspaceCorner(popoverElement, position);
};

/**
 * Points a popover's arrow at the middle of what it is explaining.
 * driver.js chooses where along the popover's edge the arrow goes with a rough rule (the start, middle or end)
 * that misses when the popover is tall, leaving the arrow pointing at nothing. So we place it ourselves.
 * @param {object} popover driver.js's popover elements
 * @param {?Element} element What the popover is explaining (none if the popover isn't attached to anything)
 */
const aimArrowAtTarget = (popover, element) => {
    if (!element || !popover) return;
    const {arrow, wrapper} = popover;
    const side = ['left', 'right', 'top', 'bottom']
        .find(name => arrow.classList.contains(`driver-popover-arrow-side-${name}`));
    if (!side) return;

    const target = element.getBoundingClientRect();
    const box = wrapper.getBoundingClientRect();
    const arrowSize = 10;
    const keepClearOfCorners = 16;
    const clamp = (value, length) =>
        Math.min(Math.max(value, keepClearOfCorners), length - keepClearOfCorners - arrowSize);

    if (side === 'left' || side === 'right') {
        arrow.style.top = `${clamp(target.top + (target.height / 2) - box.top - (arrowSize / 2), box.height)}px`;
        arrow.style.bottom = 'auto';
        arrow.style.marginTop = '0';
    } else {
        arrow.style.left = `${clamp(target.left + (target.width / 2) - box.left - (arrowSize / 2), box.width)}px`;
        arrow.style.right = 'auto';
        arrow.style.marginLeft = '0';
    }
};

const targetSide = target => {
    if (!target) return null;
    return target.ui ? uiSides[target.ui] : 'right';
};

const scrollFlyoutTo = (flyout, y) => {
    try {
        flyout.scrollbar_.set(Math.max(y - 20, 0));
    } catch {
        // Best effort only: the target may just end up partially off screen
    }
};

const isInView = (element, container) => {
    const bounds = element.getBoundingClientRect();
    const containerBounds = container.getBoundingClientRect();
    return bounds.top >= containerBounds.top && bounds.bottom <= containerBounds.bottom;
};

/**
 * Resolves once an element has stopped moving (for example, when the palette has finished scrolling), so that it
 * can be spotlit in the right place. If nothing is moving this only takes a few frames.
 * @param {Element} element The element to wait on
 * @returns {Promise} Resolves when the element is still, or after a time limit
 */
const waitUntilSettled = element => new Promise(resolve => {
    const startedAt = performance.now();
    let previous = null;
    let stillFrames = 0;
    const check = () => {
        const {top, left, width, height} = element.getBoundingClientRect();
        const current = [top, left, width, height];
        const isStill = previous && current.every((value, index) => Math.abs(value - previous[index]) < 0.5);
        stillFrames = isStill ? stillFrames + 1 : 0;
        previous = current;
        if (stillFrames >= SETTLED_FRAMES || performance.now() - startedAt > MAX_SETTLE_MS) return resolve();
        requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
});

/**
 * Makes sure an element in the palette is visible (scrolling the palette to it only if it is not), and still.
 * @param {Element} element The element (a block or button) in the palette
 * @param {object} flyout The palette's flyout
 * @param {number} y Where the element is in the palette's contents, used to scroll to it if needed
 * @returns {Promise.<Element>} The element, once it's in place
 */
const showInPalette = async (element, flyout, y) => {
    const palette = uiElements.palette();
    if (!palette || !isInView(element, palette)) scrollFlyoutTo(flyout, y);
    await waitUntilSettled(element);
    return element;
};

/**
 * Makes sure what a step points at is on screen, and finds it.
 * @param {object} target The step's target
 * @param {string} extensionId The extension being toured
 * @param {object} workspace The (main) scratch-blocks workspace
 * @returns {?Element|Promise.<?Element>} The element to spotlight (possibly once it is in place),
 *     or null if there isn't one or it could not be found
 */
const resolveTarget = (target, extensionId, workspace) => {
    if (!target) return null;

    if (target.ui) {
        // Scroll the palette to this extension, so its blocks are what's on screen behind the explanation.
        // The category and the palette as a whole don't move when it scrolls, so there's nothing to wait for.
        if (target.ui === 'palette' || target.ui === 'category') {
            workspace.toolbox_.setSelectedCategoryById(extensionId);
        }
        return uiElements[target.ui]?.(extensionId) ?? null;
    }

    // Everything else lives in the extension's palette
    const flyout = workspace.getFlyout();

    if (target.block) {
        const type = fullBlockType(extensionId, target.block);
        const block = flyout.getWorkspace().getTopBlocks(false)
            .find(({type: blockType}) => blockType === type);
        if (!block) return null;
        const y = block.getRelativeToSurfaceXY().y * flyout.getWorkspace().scale;
        return showInPalette(block.getSvgRoot(), flyout, y);
    }

    if (target.button) {
        const button = flyout.buttons_.find(({text_: text}) => text === target.button);
        if (!button) return null;
        return showInPalette(button.svgGroup_, flyout, button.position_?.y ?? 0);
    }

    return null;
};

const clearMarkers = () => document.querySelectorAll(`[${TARGET_ATTRIBUTE}]`)
    .forEach(element => {
        element.removeAttribute(TARGET_ATTRIBUTE);
        delete element.scrollIntoView; // Back to the browser's own
    });

const ignoreCloseRequest = () => {};

const CHECKLIST_CLASS = 'prg-tour-checklist';
const CHECKLIST_DONE_CLASS = 'prg-tour-done';
const SUCCESS_CLASS = 'prg-tour-success';

/**
 * Turns a step's popover into a small activity: a checklist that ticks off as the user does what it asks.
 * The Next button reads "Skip" until everything is done (so nobody gets stuck, e.g. without a camera).
 * @param {object} options Options
 * @param {object} options.popover driver.js's popover elements
 * @param {Array.<{label: string}>} options.conditions The step's `waitFor`
 * @param {object} options.context What the watchers need: `extensionId`, `workspace`, `vm`
 * @param {function(): void} options.onChange Called after the popover's contents change size
 * @returns {function(): void} Stops watching
 */
const setUpActivity = ({popover, conditions, context, onChange}) => {
    const finalLabel = popover.nextButton.innerHTML; // 'Next', or 'Done' on the last step

    const list = document.createElement('ul');
    list.className = CHECKLIST_CLASS;
    const items = conditions.map(({label}) => {
        const item = document.createElement('li');
        item.textContent = label;
        list.appendChild(item);
        return item;
    });

    const success = document.createElement('div');
    success.className = SUCCESS_CLASS;
    success.textContent = 'Nice work! You did it.';

    popover.description.append(list, success);

    // driver.js positions the popover itself once our contents are in, so only ask it to once we're past that
    let settingUp = true;
    const showProgress = met => {
        items.forEach((item, index) => item.classList.toggle(CHECKLIST_DONE_CLASS, index < met));
        const complete = met >= conditions.length;
        success.hidden = !complete;
        popover.nextButton.innerHTML = complete ? finalLabel : 'Skip';
        if (!settingUp) onChange();
    };

    showProgress(0);
    const stopWatching = watchConditions(conditions, context, showProgress);
    settingUp = false;

    // Don't dim or block the editor: the user has to be able to use it to do what the step asks
    document.body.classList.add(ACTIVITY_BODY_CLASS);
    return () => {
        stopWatching();
        document.body.classList.remove(ACTIVITY_BODY_CLASS);
    };
};

// How far from the left edge of the code area, and below any existing scripts, to put blocks a step adds
const ADDED_BLOCKS_X = 40;
const ADDED_BLOCKS_GAP = 40;

/**
 * Adds standard Scratch blocks (like "when green flag clicked") to the code area as one connected stack,
 * below any scripts that are already there, and scrolls to them.
 * Each block is copied from the palette rather than made from scratch, so it comes with its default inputs
 * (for example, the "Hello!" in a "say" block) and the user can type in them.
 * @param {object} options Options
 * @param {object} options.ScratchBlocks The scratch-blocks module
 * @param {object} options.workspace The (main) scratch-blocks workspace
 * @param {Array.<string>} options.opcodes The blocks to add, from top to bottom
 */
const addBlocksToWorkspace = ({ScratchBlocks, workspace, opcodes}) => {
    const {Xml} = ScratchBlocks;
    const palette = workspace.getFlyout().getWorkspace();
    const paletteBlocks = palette.getTopBlocks(false);

    const copies = opcodes.map(type => {
        const block = paletteBlocks.find(({type: blockType}) => blockType === type);
        if (!block) {
            // eslint-disable-next-line no-console
            console.warn(`Tour: could not add '${type}', because it isn't in the palette`);
            return null;
        }
        const copy = Xml.blockToDom(block, true);
        // The palette might hold a block with something already attached; we only want this block
        Array.from(copy.children).filter(({nodeName}) => nodeName.toLowerCase() === 'next')
            .forEach(next => copy.removeChild(next));
        return copy;
    }).filter(copy => copy);
    if (copies.length === 0) return;

    // Connect each block below the one before it
    copies.slice(0, -1).forEach((copy, index) => {
        const next = copy.ownerDocument.createElement('next');
        next.appendChild(copies[index + 1]);
        copy.appendChild(next);
    });

    const existing = workspace.getTopBlocks(false);
    const bottom = existing.reduce((lowest, block) =>
        Math.max(lowest, block.getRelativeToSurfaceXY().y + block.getHeightWidth().height), 0);
    const [top] = copies;
    top.setAttribute('x', `${ADDED_BLOCKS_X}`);
    top.setAttribute('y', `${existing.length > 0 ? bottom + ADDED_BLOCKS_GAP : ADDED_BLOCKS_GAP}`);

    const root = Xml.textToDom('<xml></xml>');
    root.appendChild(top);
    const [topBlockId] = Xml.domToWorkspace(root, workspace);
    workspace.centerOnBlock(topBlockId);
};

let activeTour = null;

/**
 * Starts a guided tour of an extension (replacing any tour that's already running).
 * @param {object} options Tour options
 * @param {string} options.extensionId Id of the extension to tour
 * @param {{steps: Array.<{title: string, text: string, target: ?object}>}} options.tutorial The extension's tour
 * @param {object} options.workspace The (main) scratch-blocks workspace
 * @param {object} options.vm The virtual machine (used to tell when the project runs)
 * @param {object} options.ScratchBlocks The scratch-blocks module (used to add blocks the tutorial asks for)
 * @returns {Promise} Resolves once the first step is showing
 */
export const startExtensionTour = async ({extensionId, tutorial, workspace, vm, ScratchBlocks}) => {
    if (activeTour) activeTour.destroy();
    ensureDriverStyles();

    const {steps} = tutorial;

    // driver.js finds each step's element by selector when that step becomes active, but our targets are
    // svg elements with no stable selector. So before showing a step we find its element and tag it with an attribute.
    // Steps that have already added their blocks, so going Back and Next again doesn't add them twice
    const stepsWithBlocksAdded = new Set();

    // A step that needs blocks in the code area (`addBlocks`) gets them as the tour arrives at it. That's also when
    // we offer to clear away the user's own scripts: they're only asked at the step that needs the room.
    // If they decline, the tour doesn't go into the step (and will ask again the next time it tries).
    // Returns whether the tour can go into the step.
    const setUpBlocks = index => {
        const {addBlocks} = steps[index];
        if (!(addBlocks?.length > 0) || stepsWithBlocksAdded.has(index)) return true;
        if (!prepareCodeArea({ScratchBlocks, workspace, vm})) return false;
        stepsWithBlocksAdded.add(index);
        addBlocksToWorkspace({ScratchBlocks, workspace, opcodes: addBlocks});
        return true;
    };

    const prepare = async index => {
        clearMarkers();
        const {target} = steps[index];
        const element = await resolveTarget(target, extensionId, workspace);
        if (target && !element) {
            // eslint-disable-next-line no-console
            console.warn(`Tour for '${extensionId}': could not find target for step ${index + 1}`, target);
        }
        if (element) {
            element.setAttribute(TARGET_ATTRIBUTE, `${index}`);
            // driver.js scrolls its target into view unless it is entirely on screen. That also scrolls the page
            // itself sideways if (for example) the stage is partly off the edge of a narrow window, which throws off
            // every position we measure. We scroll the palette ourselves, so have this element ignore the request.
            element.scrollIntoView = noop;
        }
        return element;
    };

    // Moving to another step takes a moment (the palette might need to scroll first), and driver.js moves relative to
    // the step it is on. So a second click on Next (or Back) in that moment would carry on from wherever the first
    // one ended up, and skip a step. Clicks that arrive before we've got there are ignored.
    let moving = null;
    const moveOnce = move => {
        if (moving) return moving;
        moving = move().finally(() => {
            moving = null;
        });
        return moving;
    };

    // Stops watching for the current step's conditions (if it has any)
    let stopActivity = noop;
    const endActivity = () => {
        stopActivity();
        stopActivity = noop;
    };

    const tour = driver({
        popoverClass: POPOVER_CLASS,
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
        overlayOpacity: 0.6,
        stagePadding: 6,
        stageRadius: 8,
        smoothScroll: false,
        // Steps change instantly. driver.js's animated transition is a fixed 400ms (so Next feels slow), and it
        // only draws the new popover halfway through, which leaves the previous one on screen and makes
        // refreshing unreliable.
        animate: false,
        // Otherwise the arrow keys move between steps, even when the user is typing in the editor
        allowKeyboardControl: false,
        // `allowClose` is what shows the X button, but it also lets clicking outside the spotlight
        // (and pressing Escape) close the tour. Those all go through `onDestroyStarted`, which we ignore,
        // while the X button gets its own handler that ends the tour.
        // (Calling `tour.destroy()` directly skips `onDestroyStarted`, so Back/Next/Done are unaffected.)
        allowClose: true,
        onHighlighted: (element, step, {state}) => aimArrowAtTarget(state.popover, element),
        onDestroyStarted: ignoreCloseRequest,
        onCloseClick: () => tour.destroy(),
        onNextClick: () => moveOnce(async () => {
            const next = tour.getActiveIndex() + 1;
            if (next < steps.length && !setUpBlocks(next)) return; // The user chose to stay on this step
            endActivity();
            if (next >= steps.length) return tour.destroy();
            await prepare(next);
            tour.moveNext();
        }),
        onPrevClick: () => moveOnce(async () => {
            const previous = tour.getActiveIndex() - 1;
            if (!setUpBlocks(previous)) return;
            endActivity();
            await prepare(previous);
            tour.movePrevious();
        }),
        onDestroyed: () => {
            endActivity();
            clearMarkers();
            document.body.classList.remove(PAUSED_BODY_CLASS);
            if (activeTour === tour) activeTour = null;
        },
        steps: steps.map((step, index) => {
            const {title, text, target, waitFor} = step;
            const position = positionOf(step);
            const popover = {title, description: text, align: 'center'};
            if (position || waitFor?.length > 0) {
                // Runs each time this step's popover is shown (after driver.js has filled in its text and buttons)
                popover.onPopoverRender = renderedPopover => {
                    if (position) pinPopover(renderedPopover.wrapper, position);
                    if (waitFor?.length > 0) {
                        endActivity();
                        stopActivity = setUpActivity({
                            popover: renderedPopover,
                            conditions: waitFor,
                            context: {extensionId, workspace, vm},
                            onChange: () => tour.refresh()
                        });
                    }
                };
            }
            // No target: no element or side, so driver.js shows the popover centered on screen
            if (!target) return {popover};
            return {
                element: `[${TARGET_ATTRIBUTE}="${index}"]`,
                popover: {...popover, side: targetSide(target)}
            };
        })
    });

    if (!setUpBlocks(0)) return;
    activeTour = tour;
    await prepare(0);
    tour.drive(0);
};
