// PRG ADDITION
import './tour-chooser.css';

/**
 * Some categories have several short tours. A tutorial is either one tour (`{steps}`, how extensions write theirs) or
 * several (`{tours: [{title, description, steps}]}`).
 * @param {object} tutorial What a category or extension offers
 * @returns {Array.<{title: ?string, description: ?string, steps: Array}>} Its tours (one for the single-tour form)
 */
export const toursOf = tutorial => tutorial.tours ?? [tutorial];

const CHOOSER_CLASS = 'prg-tour-chooser';
const GAP = 12;
const MARGIN = 8;

let open = null;

const closeChooser = () => {
    if (!open) return;
    const {element, stopListening} = open;
    open = null;
    stopListening();
    element.remove();
};

const el = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

/**
 * Shows a small menu of tours beside the "?" button, and calls `onChoose` with the one picked.
 * It goes away on a click anywhere else, on Escape, and on scroll or resize.
 * @param {Array.<{title: string, description: ?string}>} tours The tours to offer
 * @param {{left: number, right: number, top: number, bottom: number}} anchor The "?" button's place on screen
 * @param {function(object): void} onChoose Called with the tour that was picked
 */
export const chooseTour = (tours, anchor, onChoose) => {
    closeChooser();
    const element = el('div', CHOOSER_CLASS);
    element.setAttribute('role', 'menu');
    element.appendChild(el('div', 'prg-tour-chooser-heading', 'Pick a tour'));

    tours.forEach(tour => {
        const item = el('button', 'prg-tour-chooser-item');
        item.setAttribute('role', 'menuitem');
        item.appendChild(el('span', 'prg-tour-chooser-title', tour.title));
        if (tour.description) item.appendChild(el('span', 'prg-tour-chooser-description', tour.description));
        item.addEventListener('click', () => {
            closeChooser();
            onChoose(tour);
        });
        element.appendChild(item);
    });
    document.body.appendChild(element);

    const {width, height} = element.getBoundingClientRect();
    const left = Math.max(MARGIN, Math.min(anchor.right + GAP, window.innerWidth - width - MARGIN));
    const top = Math.max(MARGIN, Math.min(anchor.top, window.innerHeight - height - MARGIN));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;

    const onPointerDown = event => {
        if (!element.contains(event.target)) closeChooser();
    };
    const onKeyDown = event => {
        if (event.key === 'Escape') closeChooser();
    };
    const stopListening = () => {
        document.removeEventListener('mousedown', onPointerDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('wheel', closeChooser, true);
        window.removeEventListener('resize', closeChooser);
    };
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('wheel', closeChooser, true);
    window.addEventListener('resize', closeChooser);
    open = {element, stopListening};
    element.querySelector('button')?.focus({preventScroll: true});
};
