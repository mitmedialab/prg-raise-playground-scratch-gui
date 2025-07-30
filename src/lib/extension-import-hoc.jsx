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

    componentDidMount() {
      console.log("EXTENSION IMPORTED");
      window.addEventListener("message", (event) => {
        // ✅ (Optional) Check origin for security
        if (event.origin !== "http://localhost:5173/") return;
      
        // Handle the message
        console.log("📩 Message from parent:", event.data);
      
        if (event.data.type === "loadProject") {
          // Do something with event.data.payload
        }
      });
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

    checkboxes = {}; // Store checkboxes globally

    showFileOptionsModal() {
        const steps = [
            { name: 'Process Extension', id: 'process-extension' },
            { name: 'Run ANT', id: 'run-ant' },
            { name: 'Extract JSON', id: 'extract-json' },
            { name: 'Generate Extension', id: 'generate-extension' },
            { name: 'Build Extension', id: 'build-extension' },
        ];

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'file-options-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
        });

        // Create modal content
        const modalContent = document.createElement('div');
        Object.assign(modalContent.style, {
            background: '#fff',
            padding: '20px 40px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            width: '350px',
            textAlign: 'left',
            maxHeight: '80%',
            overflowY: 'auto',
        });

        // Title
        const title = document.createElement('h3');
        title.innerText = 'Processing Steps';
        Object.assign(title.style, {
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '20px',
            textAlign: 'center'
        });
        modalContent.appendChild(title);

        // Checkbox list
        const checkboxContainer = document.createElement('div');
        checkboxContainer.style.marginBottom = '20px';

        steps.forEach((step) => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.marginBottom = '12px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = step.id;
            checkbox.disabled = true; // Disable manual checking
            checkbox.style.marginRight = '10px';
            this.checkboxes[step.id] = checkbox;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(step.name));
            checkboxContainer.appendChild(label);
        });

        modalContent.appendChild(checkboxContainer);

        // Append modal content
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    deleteFileOptionsModal() {
        const modal = document.getElementById('file-options-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Function to check a checkbox when an API call succeeds
    updateCheckbox(stepId) {
        if (this.checkboxes[stepId]) {
            this.checkboxes[stepId].checked = true;
        }
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

    async refreshExtension(map) {
      // Process ZIP files
        let scriptJs = "";
        let extId = "";
        let contentMap = {};

        Object.keys(map).map(async (relativePath) => {
          const content = map[relativePath];
          const fileName = relativePath;

          console.log(fileName);

          if (fileName === "AuxiliaryExtensionInfo.js") {
            const extensionJSON = await this.readAuxiliaryExtensionInfo(content);
            if (!window["AuxiliaryExtensionInfo"]) {
              window["AuxiliaryExtensionInfo"] = extensionJSON;
            }
            const name = Object.keys(extensionJSON)[0];
            extId = name;
            this.extJson = extensionJSON;
            contentMap["AuxiliaryExtensionInfo"] = content;
          } else if (fileName === "ExtensionFramework.js") {
            contentMap["ExtensionFramework"] = content;
          } else {
            console.log(fileName);
            const id = fileName.split('.').slice(0, -1).join('.');
            if (!fileName.includes(".map") && !fileName.includes("._")) {
              scriptJs = content;
            }
          }
        });

        console.log("after");

        this.untilCommonObjects(contentMap);

        if (window[extId]) {
            window[extId] = null;
        }

        console.log("after 2");
        console.log(scriptJs);
        this.untilScriptLoaded(scriptJs);

        await new Promise(resolve => setTimeout(resolve, 500));

        const { Extension, ...aux } = window[extId];

        console.log("after 3");
        try {
          const extIdClass = class extends Extension {
              constructor(runtime) {
                super(runtime, ...window["AuxiliaryExtensionInfo"][extId]);
              }
          };
          const extensionInstance = new extIdClass(this.props.vm.runtime);
          extensionInstance["internal_init"]();

          console.log("after 4");

          const serviceName = this.props.vm.extensionManager._registerInternalExtension(extensionInstance);
          this.props.vm.extensionManager._loadedExtensions.set(extId, serviceName);
        } catch (e) {
          console.error(e);
        }
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
    async handleChange(e) {
        const thisFileInput = e.target;
        if (thisFileInput.files) {
          this.fileToUpload = thisFileInput.files[0];
      
          const formData = new FormData();
          formData.append('zipfile', this.fileToUpload); // Use `this.fileToUpload` instead of `selectedFile`
          this.showFileOptionsModal();
          this.props.closeFileMenu();
      
          try {
            // Step 1: Process extension
            // let res = await fetch('http://localhost:3000/process-extension', { method: 'POST', body: formData });
            // await res.json();
            // this.updateCheckbox('process-extension');

            // Step 2: Run ANT
            // let res = await fetch('http://localhost:3000/run-ant', { method: 'POST', body: formData });
            // await res.json();
            // this.updateCheckbox('run-ant');

            // Step 3: Extract JSON
            // let res = await fetch('http://localhost:3000/extract-json', { method: 'POST', body: formData });
            // await res.json();
            // this.updateCheckbox('extract-json');

            // // Step 4: Generate Extension
            // res = await fetch('http://localhost:3000/generate-extension', { method: 'POST', body: formData });
            // await res.json();
            // this.updateCheckbox('generate-extension');

            // // Step 5: Build Extension
            // res = await fetch('http://localhost:3000/build-extension', { method: 'POST', body: formData });
            // const data = await res.json();
            // this.updateCheckbox('build-extension');

      
            // // Fetch and process the zip file
            // const response = await fetch(data.downloadUrl);
            // const blob = await response.blob();
            // this.fileToUpload = blob;
      
            // Load ZIP with JSZip
            const zip = await JSZip.loadAsync(this.fileToUpload);

            let fileMap = {};
            const filePromises = Object.keys(zip.files).map(async (relativePath) => {
              const file = zip.files[relativePath];
              const fileName = relativePath.split('/').pop();
              const content = await file.async("string");
              fileMap[fileName] = content;
            });

            await Promise.all(filePromises);

            console.log("file map", fileMap);

            await this.refreshExtension(fileMap);
      
              // if (fileName === "AuxiliaryExtensionInfo.js") {
              //   const extensionJSON = await this.readAuxiliaryExtensionInfo(content);
              //   const name = Object.keys(extensionJSON)[0];
              //   extId = name;
              //   this.extJson = extensionJSON;
              //   contentMap["AuxiliaryExtensionInfo"] = content;
              // } else if (fileName === "ExtensionFramework.js") {
              //   contentMap["ExtensionFramework"] = content;
              // } else {
              //   console.log(fileName);
              //   const id = fileName.split('.').slice(0, -1).join('.');
              //   if (!fileName.includes(".map") && !fileName.includes("._")) {
              //     scriptJs = content;
              //   }
              // }

            
            // Process ZIP files
            // let scriptJs = "";
            // let extId = "";
            // let contentMap = {};
      
            // const filePromises = Object.keys(zip.files).map(async (relativePath) => {
            //   const file = zip.files[relativePath];
            //   const fileName = relativePath.split('/').pop();
            //   const content = await file.async("string");
      
            //   if (fileName === "AuxiliaryExtensionInfo.js") {
            //     const extensionJSON = await this.readAuxiliaryExtensionInfo(content);
            //     const name = Object.keys(extensionJSON)[0];
            //     extId = name;
            //     this.extJson = extensionJSON;
            //     contentMap["AuxiliaryExtensionInfo"] = content;
            //   } else if (fileName === "ExtensionFramework.js") {
            //     contentMap["ExtensionFramework"] = content;
            //   } else {
            //     console.log(fileName);
            //     const id = fileName.split('.').slice(0, -1).join('.');
            //     if (!fileName.includes(".map") && !fileName.includes("._")) {
            //       scriptJs = content;
            //     }
            //   }
            // });
      
            // await Promise.all(filePromises);
            // // this.untilScriptLoadedUrl("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js");
            // // this.untilScriptLoadedUrl("https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8/dist/teachablemachine-image.min.js")
            // // await new Promise(resolve => setTimeout(resolve, 1000));
      
            // this.untilCommonObjects(contentMap);
      
            // if (window[extId]) {
            //     window[extId] = null;
            // }
            // this.untilScriptLoaded(scriptJs);
    
            // const { Extension, ...aux } = window[extId];
    
            // try {
            // const extIdClass = class extends Extension {
            //     constructor(runtime) {
            //     super(runtime, ...window["AuxiliaryExtensionInfo"][extId]);
            //     }
            // };
            // const extensionInstance = new extIdClass(this.props.vm.runtime);
            // extensionInstance["internal_init"]();
    
            // const serviceName = this.props.vm.extensionManager._registerInternalExtension(extensionInstance);
            // this.props.vm.extensionManager._loadedExtensions.set(extId, serviceName);
            // } catch (e) {
            // console.error(e);
            // }
          } catch (err) {
            console.error("Error:", err);
            alert('Conversion failed: ' + err.message);
            modal.style.display = 'none';
          }
      
          this.deleteFileOptionsModal();
          this.removeFileObjects();
          
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
