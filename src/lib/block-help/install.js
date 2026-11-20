// PRG ADDITION
import './block-help.css';
import {helpFor} from './help';

/**
 * Adds "What does this do?" to the right-click menu of blocks we have an explanation for, and shows the explanation
 * in a small popover beside the block. Works on blocks in the code area and in the palette.
 */

const POPOVER_CLASS = 'prg-block-help';
const MENU_TEXT = 'What does this do?';
const GAP = 12;
const MARGIN = 8;

let openPopover = null;

const closePopover = () => {
    if (!openPopover) return;
    const {element, stopListening} = openPopover;
    openPopover = null;
    stopListening();
    element.remove();
};

const div = (className, text) => {
    const element = document.createElement('div');
    element.className = className;
    if (text) element.textContent = text;
    return element;
};

const buildPopover = (help, colour) => {
    const element = div(POPOVER_CLASS);
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-label', help.title);

    const stripe = div('prg-block-help-stripe');
    stripe.style.background = colour;
    element.appendChild(stripe);

    const body = div('prg-block-help-body');
    body.appendChild(div('prg-block-help-title', help.title));
    const what = div('prg-block-help-what', help.what);
    body.appendChild(what);
    if (help.example) {
        const example = div('prg-block-help-example');
        example.appendChild(document.createElement('b')).textContent = 'Try it';
        example.appendChild(document.createTextNode(help.example));
        body.appendChild(example);
    }
    element.appendChild(body);

    const close = document.createElement('button');
    close.className = 'prg-block-help-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', closePopover);
    element.appendChild(close);
    return {element, close};
};

// Beside the block (to its right, or its left if there isn't room), kept on screen
const placeBeside = (element, anchor) => {
    const {width, height} = element.getBoundingClientRect();
    let left = anchor.right + GAP;
    if (left + width > window.innerWidth - MARGIN) left = anchor.left - GAP - width;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));
    const top = Math.max(MARGIN, Math.min(anchor.top, window.innerHeight - height - MARGIN));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
};

const showPopover = (block, help) => {
    closePopover();
    const {element, close} = buildPopover(help, block.getColour());
    document.body.appendChild(element);
    placeBeside(element, block.getSvgRoot().getBoundingClientRect());

    // Goes away on a click anywhere else, Escape, or scrolling (the block it points at would have moved)
    const onPointerDown = event => {
        if (!element.contains(event.target)) closePopover();
    };
    const onKeyDown = event => {
        if (event.key === 'Escape') closePopover();
    };
    const stopListening = () => {
        document.removeEventListener('mousedown', onPointerDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('wheel', closePopover, true);
        window.removeEventListener('resize', closePopover);
    };
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('wheel', closePopover, true);
    window.addEventListener('resize', closePopover);
    openPopover = {element, stopListening};
    close.focus({preventScroll: true});
};

/**
 * @param {object} ScratchBlocks The scratch-blocks module. Safe to call more than once.
 */
const installBlockHelp = ScratchBlocks => {
    const {BlockSvg, ContextMenu} = ScratchBlocks;
    if (!BlockSvg || BlockSvg.prototype.hasBlockHelpSupport) return;
    BlockSvg.prototype.hasBlockHelpSupport = true;

    const showContextMenu = BlockSvg.prototype.showContextMenu_;
    BlockSvg.prototype.showContextMenu_ = function (event) {
        // A menu or input on a block explains the block it belongs to
        let block = this;
        while (block.isShadow() && block.getParent()) block = block.getParent();
        const help = helpFor(block.type);
        if (!help) return showContextMenu.call(this, event);

        // scratch-blocks builds and shows the menu in one go, with no way to add to it from outside, so we
        // add our item to the list it is about to show.
        const show = ContextMenu.show;
        ContextMenu.show = (e, options, rtl) => {
            ContextMenu.show = show;
            options.push({
                text: MENU_TEXT,
                enabled: true,
                callback: () => showPopover(block, help)
            });
            show.call(ContextMenu, e, options, rtl);
        };
        try {
            showContextMenu.call(this, event);
        } finally {
            ContextMenu.show = show;
        }
    };
};

export default installBlockHelp;
