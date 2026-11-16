import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';

import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import {closeFeedbackModal} from '../../reducers/modals';
import {FEEDBACK_ENDPOINT, FEEDBACK_TOKEN, FEEDBACK_MAX_MESSAGE_LENGTH} from '../../lib/feedback-config';

import styles from './feedback-modal.css';

const messages = defineMessages({
    title: {
        id: 'gui.feedbackModal.title',
        defaultMessage: 'Questions & Feedback',
        description: 'Title of the feedback / contact form modal'
    },
    typeQuestion: {
        id: 'gui.feedbackModal.typeQuestion',
        defaultMessage: 'Question',
        description: 'Feedback category: a question'
    },
    typeBug: {
        id: 'gui.feedbackModal.typeBug',
        defaultMessage: 'Something isn\'t working',
        description: 'Feedback category: a bug report'
    },
    typeIdea: {
        id: 'gui.feedbackModal.typeIdea',
        defaultMessage: 'Idea or suggestion',
        description: 'Feedback category: an idea or suggestion'
    },
    typeOther: {
        id: 'gui.feedbackModal.typeOther',
        defaultMessage: 'Other',
        description: 'Feedback category: other'
    },
    messagePlaceholder: {
        id: 'gui.feedbackModal.messagePlaceholder',
        defaultMessage: 'Tell us what\'s on your mind. If something isn\'t working, what did you expect to happen?',
        description: 'Placeholder text for the feedback message box'
    },
    namePlaceholder: {
        id: 'gui.feedbackModal.namePlaceholder',
        defaultMessage: 'Optional',
        description: 'Placeholder for the optional name field'
    },
    emailPlaceholder: {
        id: 'gui.feedbackModal.emailPlaceholder',
        defaultMessage: 'Optional, only if you\'d like a reply',
        description: 'Placeholder for the optional email field'
    },
    errorEmail: {
        id: 'gui.feedbackModal.errorEmail',
        defaultMessage: 'That email address doesn\'t look quite right.',
        description: 'Validation error for an invalid email address'
    },
    errorSend: {
        id: 'gui.feedbackModal.errorSend',
        defaultMessage: 'Sorry, we couldn\'t send your message. Please check your connection and try again.',
        description: 'Error shown when submitting feedback fails'
    }
});

const CATEGORIES = [
    {value: 'question', message: messages.typeQuestion},
    {value: 'bug', message: messages.typeBug},
    {value: 'idea', message: messages.typeIdea},
    {value: 'other', message: messages.typeOther}
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS = {
    EDITING: 'editing',
    SENDING: 'sending',
    SENT: 'sent',
    ERROR: 'error'
};

/**
 * A random id that lasts until the page is reloaded, which lets the server limit how many messages
 * one open editor can send. It is only kept in memory (never stored on the device), and it
 * isn't derived from anything about the person, so it can't recognize anyone across visits.
 */
const sessionId = window.crypto && window.crypto.randomUUID ?
    window.crypto.randomUUID() :
    `${Date.now()}-${String(Math.random()).substring(2)}`;

class FeedbackModal extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChange',
            'handleSubmit',
            'handleSendAnother'
        ]);
        this.state = this.initialState();
    }
    initialState () {
        return {
            category: 'question',
            message: '',
            name: '',
            email: '',
            website: '', // honeypot: real users never see or fill this
            emailError: false,
            status: STATUS.EDITING
        };
    }
    handleChange (e) {
        const {name, value} = e.target;
        const update = {[name]: value};
        if (name === 'email') update.emailError = false;
        if (this.state.status === STATUS.ERROR) update.status = STATUS.EDITING;
        this.setState(update);
    }
    handleSendAnother () {
        this.setState(this.initialState());
    }
    handleSubmit (e) {
        e.preventDefault();
        const {category, message, name, email, website, status} = this.state;
        if (status === STATUS.SENDING || !message.trim()) return;

        const trimmedEmail = email.trim();
        if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
            this.setState({emailError: true});
            return;
        }

        if (!FEEDBACK_ENDPOINT) {
            // eslint-disable-next-line no-console
            console.warn('Feedback form: FEEDBACK_ENDPOINT is not configured (see src/lib/feedback-config.js).');
            this.setState({status: STATUS.ERROR});
            return;
        }

        this.setState({status: STATUS.SENDING});
        const payload = {
            category,
            message: message.trim(),
            name: name.trim(),
            email: trimmedEmail,
            website,
            token: FEEDBACK_TOKEN,
            clientId: sessionId,
            // The site's own address, so we know which version of the editor it was sent from
            page: window.location.origin + window.location.pathname
        };

        // text/plain keeps this a "simple" CORS request, which Apps Script supports
        // (it cannot answer the preflight that application/json would trigger).
        fetch(FEEDBACK_ENDPOINT, {
            method: 'POST',
            headers: {'Content-Type': 'text/plain;charset=utf-8'},
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(result => {
                if (!result || !result.ok) throw new Error((result && result.error) || 'Unknown error');
                this.setState({status: STATUS.SENT});
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.error('Feedback form: failed to send', err);
                this.setState({status: STATUS.ERROR});
            });
    }
    renderSent () {
        return (
            <Box className={styles.sent}>
                <div className={styles.sentIcon}>{'✓'}</div>
                <h2 className={styles.sentTitle}>
                    <FormattedMessage
                        defaultMessage="Thanks, we got your message!"
                        description="Heading shown after feedback is sent"
                        id="gui.feedbackModal.sentTitle"
                    />
                </h2>
                <p className={styles.sentBody}>
                    {this.state.email.trim() ? (
                        <FormattedMessage
                            defaultMessage={'We read every message. If you asked a question, ' +
                                'we\'ll reply to the email you gave us.'}
                            description="Body shown after feedback is sent with an email address"
                            id="gui.feedbackModal.sentBodyWithEmail"
                        />
                    ) : (
                        <FormattedMessage
                            defaultMessage="We read every message and use it to make the Playground better."
                            description="Body shown after feedback is sent without an email address"
                            id="gui.feedbackModal.sentBody"
                        />
                    )}
                </p>
                <Box className={styles.buttonRow}>
                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={this.handleSendAnother}
                    >
                        <FormattedMessage
                            defaultMessage="Send another"
                            description="Button to send another feedback message"
                            id="gui.feedbackModal.sendAnother"
                        />
                    </button>
                    <button
                        className={styles.primaryButton}
                        type="button"
                        onClick={this.props.onRequestClose}
                    >
                        <FormattedMessage
                            defaultMessage="Done"
                            description="Button to close the feedback modal"
                            id="gui.feedbackModal.done"
                        />
                    </button>
                </Box>
            </Box>
        );
    }
    renderForm () {
        const {intl} = this.props;
        const {category, message, name, email, website, emailError, status} = this.state;
        const sending = status === STATUS.SENDING;
        const remaining = FEEDBACK_MAX_MESSAGE_LENGTH - message.length;

        return (
            <form
                noValidate
                className={styles.form}
                onSubmit={this.handleSubmit}
            >
                <p className={styles.intro}>
                    <FormattedMessage
                        defaultMessage="Have a question, found a bug, or have an idea? We'd love to hear from you."
                        description="Intro text for the feedback form"
                        id="gui.feedbackModal.intro"
                    />
                </p>

                <fieldset className={styles.fieldset}>
                    <legend className={styles.label}>
                        <FormattedMessage
                            defaultMessage="What is this about?"
                            description="Label for the feedback category choice"
                            id="gui.feedbackModal.categoryLabel"
                        />
                    </legend>
                    <div className={styles.chips}>
                        {CATEGORIES.map(c => (
                            <label
                                className={category === c.value ? styles.chipSelected : styles.chip}
                                key={c.value}
                            >
                                <input
                                    checked={category === c.value}
                                    className={styles.visuallyHidden}
                                    name="category"
                                    type="radio"
                                    value={c.value}
                                    onChange={this.handleChange}
                                />
                                {intl.formatMessage(c.message)}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <label
                    className={styles.label}
                    htmlFor="feedback-message"
                >
                    <FormattedMessage
                        defaultMessage="Message"
                        description="Label for the feedback message box"
                        id="gui.feedbackModal.messageLabel"
                    />
                </label>
                <textarea
                    required
                    autoFocus
                    className={styles.textarea}
                    disabled={sending}
                    id="feedback-message"
                    maxLength={FEEDBACK_MAX_MESSAGE_LENGTH}
                    name="message"
                    placeholder={intl.formatMessage(messages.messagePlaceholder)}
                    rows={6}
                    value={message}
                    onChange={this.handleChange}
                />
                {remaining < 500 ? (
                    <div className={styles.counter}>{remaining}</div>
                ) : null}

                <div className={styles.row}>
                    <div className={styles.col}>
                        <label
                            className={styles.label}
                            htmlFor="feedback-name"
                        >
                            <FormattedMessage
                                defaultMessage="Name"
                                description="Label for the optional name field"
                                id="gui.feedbackModal.nameLabel"
                            />
                        </label>
                        <input
                            autoComplete="name"
                            className={styles.input}
                            disabled={sending}
                            id="feedback-name"
                            maxLength={100}
                            name="name"
                            placeholder={intl.formatMessage(messages.namePlaceholder)}
                            type="text"
                            value={name}
                            onChange={this.handleChange}
                        />
                    </div>
                    <div className={styles.col}>
                        <label
                            className={styles.label}
                            htmlFor="feedback-email"
                        >
                            <FormattedMessage
                                defaultMessage="Email"
                                description="Label for the optional email field"
                                id="gui.feedbackModal.emailLabel"
                            />
                        </label>
                        <input
                            aria-invalid={emailError}
                            autoComplete="email"
                            className={emailError ? styles.inputInvalid : styles.input}
                            disabled={sending}
                            id="feedback-email"
                            maxLength={200}
                            name="email"
                            placeholder={intl.formatMessage(messages.emailPlaceholder)}
                            type="email"
                            value={email}
                            onChange={this.handleChange}
                        />
                    </div>
                </div>
                {emailError ? (
                    <div
                        className={styles.fieldError}
                        role="alert"
                    >
                        {intl.formatMessage(messages.errorEmail)}
                    </div>
                ) : null}

                {/* Honeypot field: hidden from people, filled in by spam bots. */}
                <div
                    aria-hidden="true"
                    className={styles.honeypot}
                >
                    <label htmlFor="feedback-website">{'Website'}</label>
                    <input
                        autoComplete="off"
                        id="feedback-website"
                        name="website"
                        tabIndex={-1}
                        type="text"
                        value={website}
                        onChange={this.handleChange}
                    />
                </div>

                <p className={styles.privacyNote}>
                    <FormattedMessage
                        defaultMessage={'Please don\'t include personal information like your address or ' +
                            'phone number.'}
                        description="Privacy note at the bottom of the feedback form"
                        id="gui.feedbackModal.privacyNote"
                    />
                </p>

                {status === STATUS.ERROR ? (
                    <div
                        className={styles.sendError}
                        role="alert"
                    >
                        {intl.formatMessage(messages.errorSend)}
                    </div>
                ) : null}

                <Box className={styles.buttonRow}>
                    <button
                        className={styles.secondaryButton}
                        disabled={sending}
                        type="button"
                        onClick={this.props.onRequestClose}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel"
                            description="Button to cancel the feedback form"
                            id="gui.feedbackModal.cancel"
                        />
                    </button>
                    <button
                        className={styles.primaryButton}
                        disabled={sending || !message.trim()}
                        type="submit"
                    >
                        {sending ? (
                            <FormattedMessage
                                defaultMessage="Sending…"
                                description="Submit button text while feedback is sending"
                                id="gui.feedbackModal.sending"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Send"
                                description="Button to submit the feedback form"
                                id="gui.feedbackModal.send"
                            />
                        )}
                    </button>
                </Box>
            </form>
        );
    }
    render () {
        return (
            <Modal
                className={styles.modalContent}
                contentLabel={this.props.intl.formatMessage(messages.title)}
                id="feedbackModal"
                onRequestClose={this.props.onRequestClose}
            >
                <Box className={styles.body}>
                    {this.state.status === STATUS.SENT ? this.renderSent() : this.renderForm()}
                </Box>
            </Modal>
        );
    }
}

FeedbackModal.propTypes = {
    intl: intlShape.isRequired,
    onRequestClose: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
    onRequestClose: () => dispatch(closeFeedbackModal())
});

export default injectIntl(connect(null, mapDispatchToProps)(FeedbackModal));
