// PRG ADDITION
// Blocks are named `<category>_<block>`, and for extensions the category is the extension's id.
// Scratch's own categories mostly follow the same rule, but a few use another word in their blocks' names.
const BLOCK_PREFIXES = {
    events: 'event',
    operators: 'operator',
    variables: 'data',
    myBlocks: 'procedures'
};

/**
 * The full name of a block, as used in a workspace.
 * @param {string} categoryId The extension or palette category the block is in (like 'pen' or 'events')
 * @param {string} block The block's name within its category (like 'penDown' or 'broadcast')
 * @returns {string} For example 'pen_penDown' or 'event_broadcast'
 */
const fullBlockType = (categoryId, block) => `${BLOCK_PREFIXES[categoryId] ?? categoryId}_${block}`;

export default fullBlockType;
