const OPEN_MODAL = 'scratch-gui/modals/OPEN_MODAL';
const CLOSE_MODAL = 'scratch-gui/modals/CLOSE_MODAL';
const OPEN_MODAL_WITH_ID = 'scratch-gui/modals/OPEN_MODAL_WITH_ID';

const MODAL_BACKDROP_LIBRARY = 'backdropLibrary';
const MODAL_COSTUME_LIBRARY = 'costumeLibrary';
const MODAL_EXTENSION_LIBRARY = 'extensionLibrary';
const MODAL_LOADING_PROJECT = 'loadingProject';
const MODAL_TELEMETRY = 'telemetryModal';
const MODAL_SOUND_LIBRARY = 'soundLibrary';
const MODAL_SPRITE_LIBRARY = 'spriteLibrary';
const MODAL_SOUND_RECORDER = 'soundRecorder';
const MODAL_CONNECTION = 'connectionModal';
const MODAL_TIPS_LIBRARY = 'tipsLibrary';
const MODAL_TEXT_MODEL = 'textModelModal';
const MODAL_CLASSIFIER_MODEL = 'classifierModelModal';
const MODAL_PROGRAMMATIC = 'programmaticModal';

const initialState = {
    [MODAL_BACKDROP_LIBRARY]: false,
    [MODAL_COSTUME_LIBRARY]: false,
    [MODAL_EXTENSION_LIBRARY]: false,
    [MODAL_LOADING_PROJECT]: false,
    [MODAL_TELEMETRY]: false,
    [MODAL_SOUND_LIBRARY]: false,
    [MODAL_SPRITE_LIBRARY]: false,
    [MODAL_SOUND_RECORDER]: false,
    [MODAL_CONNECTION]: false,
    [MODAL_TIPS_LIBRARY]: false,
    [MODAL_TEXT_MODEL]: false,
    [MODAL_CLASSIFIER_MODEL]: false,
    [MODAL_PROGRAMMATIC]: undefined
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    const {type, modal, id} = action;
    switch (type) {
    case OPEN_MODAL:
        return Object.assign({}, state, {
            [modal]: true
        });
    case CLOSE_MODAL:
        return Object.assign({}, state, {
            [modal]: false
        });
    case OPEN_MODAL_WITH_ID:
        return Object.assign({}, state, {
            [modal]: id
        });
    default:
        return state;
    }
};
const openModal = function (modal) {
    return {
        type: OPEN_MODAL,
        modal: modal
    };
};
const closeModal = function (modal) {
    return {
        type: CLOSE_MODAL,
        modal: modal
    };
};
const openBackdropLibrary = function () {
    return openModal(MODAL_BACKDROP_LIBRARY);
};
const openCostumeLibrary = function () {
    return openModal(MODAL_COSTUME_LIBRARY);
};
const openExtensionLibrary = function () {
    return openModal(MODAL_EXTENSION_LIBRARY);
};
const openLoadingProject = function () {
    return openModal(MODAL_LOADING_PROJECT);
};
const openTelemetryModal = function () {
    return openModal(MODAL_TELEMETRY);
};
const openSoundLibrary = function () {
    return openModal(MODAL_SOUND_LIBRARY);
};
const openSpriteLibrary = function () {
    return openModal(MODAL_SPRITE_LIBRARY);
};
const openSoundRecorder = function () {
    return openModal(MODAL_SOUND_RECORDER);
};
const openConnectionModal = function () {
    return openModal(MODAL_CONNECTION);
};
const openTipsLibrary = function () {
    return openModal(MODAL_TIPS_LIBRARY);
};
const openTextModelModal = function () {
    return openModal(MODAL_TEXT_MODEL);
};
const openClassifierModelModal = function (id) {
    return openModal(MODAL_CLASSIFIER_MODEL);
}
const openProgrammaticModal = function(id) {
    return {
        type: OPEN_MODAL_WITH_ID,
        modal: MODAL_PROGRAMMATIC,
        id
    };;
}
const closeBackdropLibrary = function () {
    return closeModal(MODAL_BACKDROP_LIBRARY);
};
const closeCostumeLibrary = function () {
    return closeModal(MODAL_COSTUME_LIBRARY);
};
const closeExtensionLibrary = function () {
    return closeModal(MODAL_EXTENSION_LIBRARY);
};
const closeLoadingProject = function () {
    return closeModal(MODAL_LOADING_PROJECT);
};
const closeTelemetryModal = function () {
    return closeModal(MODAL_TELEMETRY);
};
const closeSpriteLibrary = function () {
    return closeModal(MODAL_SPRITE_LIBRARY);
};
const closeSoundLibrary = function () {
    return closeModal(MODAL_SOUND_LIBRARY);
};
const closeSoundRecorder = function () {
    return closeModal(MODAL_SOUND_RECORDER);
};
const closeTipsLibrary = function () {
    return closeModal(MODAL_TIPS_LIBRARY);
};
const closeConnectionModal = function () {
    return closeModal(MODAL_CONNECTION);
};
const closeTextModelModal = function () {
    return closeModal(MODAL_TEXT_MODEL);
};
const closeClassifierModelModal = function () {
    return closeModal(MODAL_CLASSIFIER_MODEL);
}
const closeProgrammaticModal = function () {
    return closeModal(MODAL_PROGRAMMATIC);
}
export {
    reducer as default,
    initialState as modalsInitialState,
    openBackdropLibrary,
    openCostumeLibrary,
    openExtensionLibrary,
    openLoadingProject,
    openSoundLibrary,
    openSpriteLibrary,
    openSoundRecorder,
    openTelemetryModal,
    openTipsLibrary,
    openConnectionModal,
    openTextModelModal,
    openClassifierModelModal,
    openProgrammaticModal,
    closeBackdropLibrary,
    closeCostumeLibrary,
    closeExtensionLibrary,
    closeLoadingProject,
    closeSpriteLibrary,
    closeSoundLibrary,
    closeSoundRecorder,
    closeTelemetryModal,
    closeTipsLibrary,
    closeConnectionModal,
    closeTextModelModal,
    closeClassifierModelModal,
    closeProgrammaticModal
};
