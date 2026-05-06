/**
 * This file was added to overcome issues with existing npm packages that:
 *   (a) https://github.com/sdoomz/react-google-picker/blob/master/src/react-google-picker.js
 *       don't ask for an app id making it impossible to pick files "shared with me" (throws a 404 error.)
 *       We copied most of this code and adapted it to the reactjs file of the code in this repo.
 *
 *   (b) https://github.com/Jose-cd/React-google-drive-picker/blob/master/src/index.tsx
 *       insists on using the "drive.readonly" scope which is sensitive. This scope is unecessary and would require app verification.
 *       We copied bits of this code to start using the new Google sign in flow
 */

import React from "react";
import PropTypes from "prop-types";
import loadScript from "load-script";

const GOOGLE_SDK_URL = "https://apis.google.com/js/api.js";
const GIS_URL = "https://accounts.google.com/gsi/client";

let scriptLoadingStarted = false;

class GoogleChooser extends React.Component {
    constructor(props) {
        super(props);
        this.onClientLoad = this.onClientLoad.bind(this);
        this.onApiLoad = this.onApiLoad.bind(this);
        this.onChoose = this.onChoose.bind(this);
    }

    componentDidMount() {
        if (this.isGoogleReady()) {
            // google api is already exists
            // init immediately
            this.onApiLoad();
        } else if (!scriptLoadingStarted) {
            // load google api and gsi then init
            scriptLoadingStarted = true;
            loadScript(GOOGLE_SDK_URL, this.onApiLoad);
        } else {
            // is loading
        }
    }

    onClientLoad() {
        window.gapi.client.init({
            apiKey: this.props.developerKey,
        });
    }

    onApiLoad() {
        // now that Gapi is loaded, load auth
        loadScript(GIS_URL);

        window.gapi.load("client", this.onClientLoad);
        window.gapi.load("picker");
    }

    isGoogleReady() {
        return !!window.gapi;
    }

    isGoogleAuthReady() {
        return !!google.accounts;
    }

    isGooglePickerReady() {
        return !!window.google.picker;
    }

    doAuth(callback) {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: this.props.clientId,
            scope: this.props.scope,
            callback: callback,
        });

        client.requestAccessToken();
    }

    onChoose() {
        if (
            !this.isGoogleReady() ||
            !this.isGoogleAuthReady() ||
            !this.isGooglePickerReady() ||
            this.props.disabled
        ) {
            console.error("Some api is missing:");
            if (!this.isGoogleReady()) {
                console.log("\tGoogle API");
            }
            if (!this.isGoogleAuthReady()) {
                console.log("\tGoogle Auth");
            }
            if (!this.isGoogleReady()) {
                console.log("\tGoogle Picker");
            }
            return null;
        }

        const token = window.gapi.client.getToken();
        const oauthToken = token && token.access_token;

        if (oauthToken) {
            if (this.props.openPickerAfterAuth) {
                this.createPicker(oauthToken);
            } else {
                this.handleDriveSave(oauthToken);
            }
        } else {
            this.doAuth((response) => {
                if (response.access_token) {
                    if (this.props.openPickerAfterAuth) {
                        this.createPicker(response.access_token);
                    } else {
                        //this.props.onAuthenticate(response.access_token);
                        this.handleDriveSave(response.access_token);
                    }
                } else {
                    this.props.onAuthFailed(response);
                }
            });
        }
    }

    createPicker(oauthToken) {
        this.props.onAuthenticate(oauthToken);

        if (this.props.createPicker) {
            return this.props.createPicker(google, oauthToken);
        }

        const googleViewId = google.picker.ViewId[this.props.viewId];
        const view = new window.google.picker.View(googleViewId);

        if (this.props.mimeTypes) {
            view.setMimeTypes(this.props.mimeTypes.join(","));
        }
        if (this.props.query) {
            view.setQuery(this.props.query);
        }

        if (!view) {
            throw new Error("Can't find view by viewId");
        }

        const picker = new window.google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(oauthToken)
            .setDeveloperKey(this.props.developerKey)
            .setCallback(this.props.onChange)
            .setAppId(this.props.appId);

        if (this.props.origin) {
            picker.setOrigin(this.props.origin);
        }

        if (this.props.navHidden) {
            picker.enableFeature(window.google.picker.Feature.NAV_HIDDEN);
        }

        if (this.props.multiselect) {
            picker.enableFeature(
                window.google.picker.Feature.MULTISELECT_ENABLED
            );
        }

        picker.build().setVisible(true);
    }

    showSaveDialog(defaultName = "") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");

        overlay.innerHTML = `
            <div style="
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div style="
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 300px;
                    font-family: sans-serif;
                ">
                    <h3>Save Project</h3>

                    <input
                        id="save-name"
                        type="text"
                        value="${defaultName}"
                        style="
                            width: 100%;
                            margin-bottom: 12px;
                            padding: 6px;
                        "
                    />

                    <label style="display:flex; gap:8px; margin-bottom:16px;">
                        <input id="overwrite-check" type="checkbox" />
                        Overwrite existing file
                    </label>

                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                        <button id="cancel-btn">Cancel</button>
                        <button id="save-btn">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector("#cancel-btn").onclick = () => {
            overlay.remove();
            resolve(null);
        };

        overlay.querySelector("#save-btn").onclick = () => {
            const fileName =
                overlay.querySelector("#save-name").value;

            const overwrite =
                overlay.querySelector("#overwrite-check").checked;

            overlay.remove();

            resolve({
                fileName,
                overwrite
            });
        };
    });
}

    async handleDriveSave(oauthToken) {
        // const fileName = prompt("Name your project", this.props.projectTitle);
        const result = await this.showSaveDialog(this.props.projectTitle);

        if (!result) return;

        const { fileName, overwrite } = result;

        if (!fileName) return;

        const fullName = fileName + ".sb3";

        // Search for existing file
        const searchResponse = await window.gapi.client.drive.files.list({
            q: `name='${fullName}' and trashed=false`,
            fields: "files(id, name)"
        });

        const existingFile = searchResponse.result.files?.[0];

        let fileId;

        if (existingFile) {
            // Overwrite existing file
            if (!overwrite) {
                alert("File already exists");
                return;
            }

            fileId = existingFile.id;
        } else {
            // Create new file
            const createResponse = await window.gapi.client.drive.files.create({
                resource: {
                    name: fullName,
                    mimeType: "application/x-zip"
                },
                fields: "id"
            });

            fileId = createResponse.result.id;
        }

        // Upload/overwrite content
        const url =
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

        this.props.vm.uploadProjectToURL(url, oauthToken);

        window.alert("Project saved");
        this.props.onRequestCloseFile();
    }

    render() {
        return (
            <div onClick={this.onChoose}>
                {this.props.children ? (
                    this.props.children
                ) : (
                    <button>Open google chooser</button>
                )}
            </div>
        );
    }
}

GoogleChooser.propTypes = {
    appId: PropTypes.string.isRequired,
    children: PropTypes.node,
    clientId: PropTypes.string.isRequired,
    developerKey: PropTypes.string,
    scope: PropTypes.string,
    viewId: PropTypes.string,
    authImmediate: PropTypes.bool,
    origin: PropTypes.string,
    onChange: PropTypes.func,
    onAuthenticate: PropTypes.func,
    onAuthFailed: PropTypes.func,
    createPicker: PropTypes.func,
    multiselect: PropTypes.bool,
    navHidden: PropTypes.bool,
    disabled: PropTypes.bool,
};

GoogleChooser.defaultProps = {
    onChange: () => {},
    onAuthenticate: () => {},
    onAuthFailed: () => {},
    scope: "https://www.googleapis.com/auth/drive.file",
    viewId: "DOCS",
    authImmediate: false,
    multiselect: false,
    navHidden: false,
    disabled: false,
};

export default GoogleChooser;
