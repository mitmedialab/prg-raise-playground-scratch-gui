// PRG ADDITION

import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import LibraryComponent from '../components/library/library.jsx';
import log from '../lib/log';
import sharedMessages from '../lib/shared-messages';
import {examples, exampleTags, projectUrl, thumbnailUrl} from '../lib/libraries/examples';

import {setProjectUnchanged} from '../reducers/project-changed';
import {setProjectTitle} from '../reducers/project-title';
import {
    closeExamplesLibrary,
    closeLoadingProject,
    openLoadingProject
} from '../reducers/modals';

const messages = defineMessages({
    examplesLibraryTitle: {
        defaultMessage: 'Choose an Example Project',
        description: 'Heading for the library of example projects',
        id: 'gui.examplesLibrary.title'
    },
    fetchError: {
        defaultMessage: 'Sorry, that example project could not be downloaded. ' +
            'Please check your connection and try again.',
        description: 'An error that displays when an example project could not be downloaded',
        id: 'gui.examplesLibrary.fetchError'
    },
    loadError: {
        defaultMessage: 'Sorry, that example project failed to load.',
        description: 'An error that displays when an example project could not be opened',
        id: 'gui.examplesLibrary.loadError'
    }
});

const libraryData = examples.map(({id, name, tags}) => ({
    rawURL: thumbnailUrl(id),
    id,
    name,
    featured: true,
    tags
}));

/**
 * The gallery of example projects. Picking one replaces the project in the editor (after asking, if the
 * current project has been changed).
 *
 * The example is downloaded first (so that nothing is replaced if that fails), and then handed to the VM.
 *
 * This deliberately doesn't go through the editor's "uploading a project" state (`requestProjectUpload`), which
 * "Load from your computer" uses: the editor's file uploader reacts to that state by expecting a file that it chose
 * itself, and cancels the load when there isn't one.
 */
class ExamplesLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);
        this.isBusy = false;
    }
    handleItemSelect (item) {
        if (this.isBusy) return;

        const {intl, projectChanged} = this.props;
        // Same question, and same condition, as for loading a project from the computer
        if (projectChanged && !confirm( // eslint-disable-line no-alert
            intl.formatMessage(sharedMessages.replaceProjectWarning)
        )) return;

        this.isBusy = true;
        this.props.onLoadingStarted();
        fetch(projectUrl(item.id))
            .then(response => {
                if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
                return response.arrayBuffer();
            })
            .catch(error => {
                log.warn(error);
                alert(intl.formatMessage(messages.fetchError)); // eslint-disable-line no-alert
            })
            .then(buffer => buffer && this.loadProject(buffer, item.name))
            .then(() => {
                this.isBusy = false;
                this.props.onLoadingFinished();
            });
    }
    loadProject (buffer, title) {
        return this.props.vm.loadProject(buffer)
            .then(() => {
                this.props.onSetProjectTitle(title);
                // Loading counts as a change, but there is nothing for the user to save yet
                this.props.onSetProjectUnchanged();
            })
            .catch(error => {
                log.warn(error);
                alert(this.props.intl.formatMessage(messages.loadError)); // eslint-disable-line no-alert
            });
    }
    render () {
        if (!this.props.visible) return null;
        return (
            <LibraryComponent
                filterable
                data={libraryData}
                id="examplesLibrary"
                tags={exampleTags}
                title={this.props.intl.formatMessage(messages.examplesLibraryTitle)}
                visible={this.props.visible}
                onItemSelected={this.handleItemSelect}
                onRequestClose={this.props.onRequestClose}
            />
        );
    }
}

ExamplesLibrary.propTypes = {
    intl: intlShape.isRequired,
    onLoadingFinished: PropTypes.func,
    onLoadingStarted: PropTypes.func,
    onRequestClose: PropTypes.func,
    onSetProjectTitle: PropTypes.func,
    onSetProjectUnchanged: PropTypes.func,
    projectChanged: PropTypes.bool,
    visible: PropTypes.bool,
    vm: PropTypes.shape({
        loadProject: PropTypes.func
    })
};

const mapStateToProps = state => ({
    projectChanged: state.scratchGui.projectChanged,
    visible: state.scratchGui.modals.examplesLibrary,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onLoadingFinished: () => dispatch(closeLoadingProject()),
    onLoadingStarted: () => dispatch(openLoadingProject()),
    onRequestClose: () => dispatch(closeExamplesLibrary()),
    onSetProjectTitle: title => dispatch(setProjectTitle(title)),
    onSetProjectUnchanged: () => dispatch(setProjectUnchanged())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ExamplesLibrary));
