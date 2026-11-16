/**
 * Where the in-editor "Feedback" form sends submissions.
 *
 * This is the URL of a Google Apps Script web app that appends each submission
 * to a Google Sheet (and optionally emails the team). See
 * `feedback-backend/README.md` for the 5-minute setup.
 *
 * It can also be supplied at build time via the FEEDBACK_ENDPOINT env var.
 * Leave empty to disable sending (the form will show a friendly error).
 */
const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwfkGvckUpBkMn-A05gtRw6p_hqLWLtHlZXL6FM6eFAw0YPqVMctNtnGNy2dAUMvxyAjQ/exec';

/** Max characters accepted for the message body (also enforced server-side). */
const FEEDBACK_MAX_MESSAGE_LENGTH = 5000;

export {
    FEEDBACK_ENDPOINT,
    FEEDBACK_MAX_MESSAGE_LENGTH
};
