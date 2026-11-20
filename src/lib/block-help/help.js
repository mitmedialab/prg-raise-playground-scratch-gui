// PRG ADDITION
/* eslint-disable max-len */
// Plain-language explanations of blocks, shown by the "What does this do?" item in a block's right-click menu.
// Keyed by the block's opcode. `title` is a short name, `what` says what the block does, and `example` (optional) is
// one concrete way to use it.
// Only some blocks are covered so far (Motion and Events); blocks without an entry just don't get the menu item.

const help = {
    // ---- Motion ----
    motion_movesteps: {
        title: 'Move',
        what: 'Moves your sprite forward by a number of steps, in the direction it is facing. A bigger number goes farther, and a negative number goes backward.',
        example: 'Put it inside a “repeat” block to walk across the stage.'
    },
    motion_turnright: {
        title: 'Turn clockwise',
        what: 'Turns your sprite to the right by a number of degrees. 90 degrees is a quarter turn, and 360 is all the way around.',
        example: 'Use “turn 15 degrees” inside “forever” to make your sprite spin.'
    },
    motion_turnleft: {
        title: 'Turn counter-clockwise',
        what: 'Turns your sprite to the left by a number of degrees.',
        example: 'Combine it with “move” and “turn” to draw shapes.'
    },
    motion_goto: {
        title: 'Go to',
        what: 'Jumps right away to the mouse pointer, a random spot on the stage, or another sprite. Pick which from the menu.',
        example: 'Put “go to random position” inside “forever” to make your sprite jump around.'
    },
    motion_gotoxy: {
        title: 'Go to x, y',
        what: 'Jumps to an exact spot on the stage. x is how far left or right (0 is the middle), and y is how far up or down (0 is the middle).',
        example: 'Use “go to x: 0 y: 0” at the start of your project to bring your sprite back to the middle.'
    },
    motion_glideto: {
        title: 'Glide to a place',
        what: 'Slides smoothly to the mouse pointer, a random spot or another sprite, taking the number of seconds you choose.',
        example: 'Glide to “random position” for 1 second to wander around.'
    },
    motion_glidesecstoxy: {
        title: 'Glide to x, y',
        what: 'Slides smoothly to an exact spot on the stage, taking the number of seconds you choose.',
        example: 'Use two of these in a row to make your sprite go there and back.'
    },
    motion_pointindirection: {
        title: 'Point in a direction',
        what: 'Turns your sprite to face a direction. 90 faces right, -90 faces left, 0 faces up and 180 faces down.',
        example: 'Click the number to pick a direction on a dial.'
    },
    motion_pointtowards: {
        title: 'Point towards',
        what: 'Turns your sprite to face the mouse pointer or another sprite.',
        example: 'Put “point towards mouse-pointer” in a “forever” loop to make your sprite watch the mouse.'
    },
    motion_changexby: {
        title: 'Change x',
        what: 'Moves your sprite left or right by a number. Positive moves it right, and negative moves it left. It ignores the way your sprite is facing.',
        example: 'Use it with the arrow keys: “change x by 10” when the right arrow is pressed.'
    },
    motion_setx: {
        title: 'Set x',
        what: 'Puts your sprite at a certain left or right position, without changing its up or down position.',
        example: 'Set x to -200 to put your sprite on the left edge.'
    },
    motion_changeyby: {
        title: 'Change y',
        what: 'Moves your sprite up or down by a number. Positive moves it up, and negative moves it down.',
        example: 'Use it with the up and down arrow keys, or make something fall with “change y by -5”.'
    },
    motion_sety: {
        title: 'Set y',
        what: 'Puts your sprite at a certain up or down position, without changing its left or right position.',
        example: 'Set y to 180 to put your sprite at the top of the stage.'
    },
    motion_ifonedgebounce: {
        title: 'Bounce off the edge',
        what: 'If your sprite is touching the edge of the stage, it turns around so it doesn’t get stuck. It does nothing otherwise.',
        example: 'Put it inside “forever” together with “move 10 steps” to bounce around the stage.'
    },
    motion_setrotationstyle: {
        title: 'Rotation style',
        what: 'Chooses how your sprite looks when it turns: all the way around, only flipped left and right, or not at all.',
        example: 'Pick “left-right” so a character walking left doesn’t turn upside down.'
    },
    motion_xposition: {
        title: 'x position',
        what: 'Tells you how far left or right your sprite is, as a number. Click the checkbox beside it to see it on the stage.',
        example: 'Use it in an “if” block to check whether the sprite has reached the right side.'
    },
    motion_yposition: {
        title: 'y position',
        what: 'Tells you how far up or down your sprite is, as a number.',
        example: 'Use it in an “if” block to check whether the sprite has hit the ground.'
    },
    motion_direction: {
        title: 'Direction',
        what: 'Tells you which way your sprite is facing, as a number of degrees.',
        example: 'Show it on the stage while you turn the sprite to see how the numbers work.'
    },

    // ---- Events ----
    event_whenflagclicked: {
        title: 'When the green flag is clicked',
        what: 'Starts the blocks below it when someone clicks the green flag above the stage.',
        example: 'Most projects start with this block. Put “go to x: 0 y: 0” under it to begin in the middle.'
    },
    event_whenkeypressed: {
        title: 'When a key is pressed',
        what: 'Starts the blocks below it when a key on the keyboard is pressed. Pick which key from the menu.',
        example: 'Make the right arrow move your sprite with “change x by 10”.'
    },
    event_whenthisspriteclicked: {
        title: 'When this sprite is clicked',
        what: 'Starts the blocks below it when someone clicks this sprite on the stage.',
        example: 'Put a “say” block under it so your sprite answers when clicked.'
    },
    event_whenstageclicked: {
        title: 'When the stage is clicked',
        what: 'Starts the blocks below it when someone clicks the stage, outside any sprite.',
        example: 'Use it to switch to the next backdrop.'
    },
    event_whenbackdropswitchesto: {
        title: 'When the backdrop changes',
        what: 'Starts the blocks below it when the stage switches to the backdrop you pick.',
        example: 'Make a sprite appear when the “night” backdrop comes on.'
    },
    event_whengreaterthan: {
        title: 'When loudness or the timer passes a number',
        what: 'Starts the blocks below it when the loudness (from a microphone) or the timer gets bigger than the number you type.',
        example: 'Use “when loudness > 10” to make something happen when someone claps.'
    },
    event_whenbroadcastreceived: {
        title: 'When a message arrives',
        what: 'Starts the blocks below it when someone sends the message you pick, from any sprite or the stage.',
        example: 'Pair it with “broadcast” to make a sprite react when another sprite finishes.'
    },
    event_broadcast: {
        title: 'Send a message',
        what: 'Sends a message to every sprite and the stage, and keeps going with the next block. Sprites that have “when I receive” that message start running.',
        example: 'Broadcast “game over” when the player loses, and have every sprite react.'
    },
    event_broadcastandwait: {
        title: 'Send a message and wait',
        what: 'Sends a message, and waits until every script that started because of it has finished before the next block runs.',
        example: 'Use it when something has to finish first, like a character walking in before it speaks.'
    }
};

/**
 * @param {string} opcode A block's type (like 'motion_movesteps')
 * @returns {?{title: string, what: string, example: ?string}} What to show for the block, if we have anything
 */
export const helpFor = opcode => help[opcode] ?? null;

export default help;
