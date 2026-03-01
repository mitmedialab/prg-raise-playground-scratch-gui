"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockIDKey = exports.guiDropdownInterop = exports.AuxiliaryExtensionInfo = exports.FrameworkID = exports.registerButtonCallbackEvent = exports.openUIEvent = void 0;
exports.openUIEvent = "OPEN_UI_FROM_EXTENSION";
exports.registerButtonCallbackEvent = "REGISTER_BUTTON_CALLBACK_FROM_EXTENSION";
exports.FrameworkID = "ExtensionFramework";
exports.AuxiliaryExtensionInfo = "AuxiliaryExtensionInfo";
/**
 * Literal values that control the interaction between the extension framework and the Scratch GUI,
 * specifically how dropdowns (tied to dynamic menus) are co-opted to support custom block arguments (and their UIs).
 */
exports.guiDropdownInterop = {
    runtimeKey: "prgDropdownCustomization",
    runtimeProperties: {
        stateKey: "state",
        entryKey: "entry",
        updateMethodKey: "update",
    },
    state: {
        open: "open",
        init: "init",
        update: "update",
        close: "close",
    },
};
exports.blockIDKey = "blockID";
