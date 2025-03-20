import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import JSZip from 'jszip';
import bindAll from 'lodash.bindall';
import { closeFileMenu } from '../reducers/menus';

const messages = defineMessages({
  loadError: {
    id: 'gui.projectLoader.loadError',
    defaultMessage: 'The project file that was selected failed to load.',
    description: 'An error that displays when a local project file fails to load.',
  },
});

/**
 * Higher Order Component to provide behavior for loading local project files into editor.
 * @param {React.Component} WrappedComponent the component to add project file loading functionality to
 * @returns {React.Component} WrappedComponent with project file loading functionality added
 */
const ExtensionImportHOC = (WrappedComponent) => {
  class ExtensionImportComponent extends React.Component {
    constructor(props) {
      super(props);
      bindAll(this, [
        'createFileObjects',
        'handleStartSelectingExtensionUpload',
        'handleChange',
        'removeFileObjects',
      ]);
    }

    componentWillUnmount() {
      this.removeFileObjects();
    }

    handleStartSelectingExtensionUpload() {
      this.createFileObjects(); // step 2: create file objects and open file chooser
    }

    createFileObjects() {
      this.removeFileObjects(); // cleanup any previous file objects

      // Create fileReader
      this.fileReader = new FileReader();
      this.fileReader.onload = this.onload;

      // Create <input> element for file selection
      this.inputElement = document.createElement('input');
      this.inputElement.accept = '.zip';
      this.inputElement.style.display = 'none';
      this.inputElement.type = 'file';
      this.inputElement.onchange = this.handleChange;
      document.body.appendChild(this.inputElement);

      // Trigger file chooser
      this.inputElement.click();
    }

    readAuxiliaryExtensionInfo(content) {
      return new Promise((resolve, reject) => {
        const match = content.match(/var\s+AuxiliaryExtensionInfo\s*=\s*(\{[\s\S]*?\})\s*;?/);
        if (match && match[1]) {
          try {
            const json = JSON.parse(match[1]);
            resolve(json);
          } catch (parseError) {
            reject(new Error('Failed to parse AuxiliaryExtensionInfo JSON'));
          }
        } else {
          reject(new Error('AuxiliaryExtensionInfo variable not found'));
        }
      });
    }

    getCommonObject(id) {
      return window[id];
    }

    untilScriptLoaded(content) {
      const scriptTag = document.createElement('script');
      scriptTag.textContent = content;
      try {
        document.body.appendChild(scriptTag);
      } catch (e) {

      }
    }

    validateCommonObject(id) {
      this.getCommonObject(id)
        ? console.log(`'${id}' successfully loaded!`)
        : console.error(`Could not find '${id}' object after loading script`);
    }

    untilCommonObjects(commonMap) {
      Object.entries(commonMap).forEach(([id, content]) => {
        if (this.getCommonObject(id)) {
          if (id === 'AuxiliaryExtensionInfo') {
            window['AuxiliaryExtensionInfo'][id] = this.extJson[id];
          }
          return; // Already loaded
        }
        this.untilScriptLoaded(content);
      });
    }

    extJson = {};
    handleChange(e) {
      const thisFileInput = e.target;
      if (thisFileInput.files) {
        this.fileToUpload = thisFileInput.files[0];

        const zip = new JSZip();
        zip.loadAsync(this.fileToUpload)
        .then((unzipped) => {
            // Iterate through all files in the zip using forEach instead of map
            
            let scriptJs = "";
            let extId = "";
            let contentMap = {};

            const filePromises = [];

            unzipped.forEach((relativePath, file) => {
                const fileName = relativePath.split('/').pop();

                const filePromise = file.async("string").then((content) => {
                    if (fileName === "AuxiliaryExtensionInfo.js") {
                        return this.readAuxiliaryExtensionInfo(content).then((extensionJSON) => {
                            const name = Object.keys(extensionJSON)[0];
                            extId = name;
                            this.extJson = extensionJSON;
                            contentMap["AuxiliaryExtensionInfo"] = content;
                        });
                    } else if (fileName === "ExtensionFramework.js") {
                        contentMap["ExtensionFramework"] = content;
                    } else {
                        const id = fileName.split('.').slice(0, -1).join('.');
                        if (!fileName.includes(".map")) {
                            scriptJs = content;
                        }
                    }
                });

                filePromises.push(filePromise);
            });

            Promise.all(filePromises).then(() => {
                this.untilCommonObjects(contentMap);
                if (!window[extId]) {
                    this.untilScriptLoaded(scriptJs)

                    const { Extension, ...aux } = window[extId];
                    try {
                        const extIdClass = class extends Extension {
                            constructor(runtime) { super(runtime, ...window["AuxiliaryExtensionInfo"][extId]) }
                        }
                        const extensionInstance = new extIdClass(this.props.vm.runtime);
                        extensionInstance["internal_init"]();
                        
                        const serviceName = this.props.vm.extensionManager._registerInternalExtension(extensionInstance);
                        this.props.vm.extensionManager._loadedExtensions.set(extId, serviceName);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        })
        .catch((err) => {
            console.error("Unzip error:", err);
            this.props.closeFileMenu();
        });

        this.removeFileObjects();
        this.props.closeFileMenu();
      }
    }

    removeFileObjects() {
      if (this.inputElement) {
        this.inputElement.value = null;
        document.body.removeChild(this.inputElement);
      }
      this.inputElement = null;
      this.fileReader = null;
      this.fileToUpload = null;
    }

    render() {
      const { closeFileMenu: closeFileMenuProp, ...componentProps } = this.props;
      return (
        <React.Fragment>
          <WrappedComponent
            onStartSelectingExtensionUpload={this.handleStartSelectingExtensionUpload}
            {...componentProps}
          />
        </React.Fragment>
      );
    }
  }

  ExtensionImportComponent.propTypes = {
    vm: PropTypes.shape({
      extensionManager: PropTypes.shape({
        _registerInternalExtension: PropTypes.func,
        _loadedExtensions: PropTypes.instanceOf(Map),
      }),
      runtime: PropTypes.object,
    }).isRequired,
  };

  const mapStateToProps = (state) => ({
    vm: state.scratchGui.vm,
  });

  const mapDispatchToProps = {
    closeFileMenu,
  };

  const mergeProps = (stateProps, dispatchProps, ownProps) => ({
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
  });

  return injectIntl(connect(mapStateToProps, mapDispatchToProps, mergeProps)(ExtensionImportComponent));
};

export default ExtensionImportHOC;
