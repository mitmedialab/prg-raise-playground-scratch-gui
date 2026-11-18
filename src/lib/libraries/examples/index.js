// PRG ADDITION

import {defineMessages} from 'react-intl';

/**
 * Example projects for the "Examples" gallery.
 *
 * The projects themselves are hosted by the Dancing with AI site (https://dancingwithai.media.mit.edu/), which is
 * where they come from, and are only downloaded when someone picks one. Each entry's `file` is the name of the
 * project there (without `.sb3`). To add one: add an entry below, and put a still picture of it (`<id>.jpg`,
 * about 480px wide) into `static/examples/`. `tags` can be any of the keys of `tagMessages`.
 *
 * (The thumbnails are stills, kept in this repository, because the site's animated previews are far too big
 * to load all at once.)
 */

const tagMessages = defineMessages({
    hand: {
        defaultMessage: 'Hand Sensing',
        description: 'Tag for filtering the example projects for ones that use hand sensing',
        id: 'gui.examplesLibrary.tag.hand'
    },
    face: {
        defaultMessage: 'Face Sensing',
        description: 'Tag for filtering the example projects for ones that use face sensing',
        id: 'gui.examplesLibrary.tag.face'
    },
    body: {
        defaultMessage: 'Body Sensing',
        description: 'Tag for filtering the example projects for ones that use body sensing',
        id: 'gui.examplesLibrary.tag.body'
    },
    teachable: {
        defaultMessage: 'Teachable Machine',
        description: 'Tag for filtering the example projects for ones that use Teachable Machine',
        id: 'gui.examplesLibrary.tag.teachable'
    }
});

const exampleTags = Object.keys(tagMessages).map(tag => ({tag, intlLabel: tagMessages[tag]}));

const examples = [
    {id: 'shy-dog', file: 'NewShyDog', name: 'Shy Dog', tags: ['teachable']},
    {id: 'circle-drawing', file: 'circle-drawing', name: 'Circle Drawing', tags: ['hand']},
    {id: 'hand-spray-paint', file: 'hand-spray-paint', name: 'Hand Spray Paint', tags: ['hand', 'body']},
    {id: 'be-a-pirate', file: 'Pirate Face', name: 'Be a Pirate', tags: ['face']},
    {id: 'emotion-jellyfish', file: 'EmotionJellyfish', name: 'Emotion Jellyfish', tags: ['face']},
    {id: 'yummy-food', file: 'YummyFood', name: 'Yummy Food', tags: ['face']},
    {id: 'chirp-bird-forever', file: 'ChirpBirdForever', name: 'Chirp Bird Forever', tags: ['face']},
    {id: 'eyelash-butterfly', file: 'EyelashButterfly', name: 'Eyelash Butterfly', tags: ['face']},
    {id: 'no-trash', file: 'NoTrash', name: 'No Trash', tags: ['teachable']},
    {id: 'finger-puppet-show', file: 'FingerPuppetShow', name: 'Finger Puppet Show', tags: ['hand']},
    {id: 'which-bin', file: 'WhichBin', name: 'Which Bin', tags: ['teachable']},
    {id: 'catcher-model', file: 'CatcherModel', name: 'Catcher Model', tags: ['teachable']},
    {id: 'snake-game', file: 'SnakeGame', name: 'Snake Game', tags: ['teachable']},
    {id: 'shoulder-friend', file: 'ShoulderFriend', name: 'Shoulder Friend', tags: ['body']},
    {id: 'my-mask', file: 'MyMask', name: 'My Mask', tags: ['teachable']},
    {id: 'yay-grr', file: 'YayGrr', name: 'Yay Grr', tags: ['face']},
    {id: 'rainbow-volleyball', file: 'RainbowVolleyball', name: 'Rainbow Volleyball', tags: ['face']},
    {id: 'bunny-ears', file: 'bunnyears', name: 'Bunny Ears', tags: ['teachable']},
    {id: 'no-corona', file: 'nocorona', name: 'No Corona', tags: ['teachable']},
    {id: 'posture-checker', file: 'posturechecker', name: 'Posture Checker', tags: ['teachable']},
    {id: 'finger-food-ninja', file: 'FingerFoodNinja', name: 'Finger Food Ninja', tags: ['hand']}
];

// Where the example projects are hosted. The site allows other sites to download from it (CORS).
const PROJECTS_HOST = 'https://dancingwithai.media.mit.edu/projects';
const THUMBNAILS_FOLDER = 'static/examples';

const projectUrl = id => {
    const example = examples.find(candidate => candidate.id === id);
    return `${PROJECTS_HOST}/${encodeURIComponent(example.file)}.sb3`;
};
const thumbnailUrl = id => `${THUMBNAILS_FOLDER}/${id}.jpg`;

export {examples, exampleTags, projectUrl, thumbnailUrl};
