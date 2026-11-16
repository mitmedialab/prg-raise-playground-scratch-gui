/**
 * Where the in-editor "Feedback" form sends submissions 
 */
const FEEDBACK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwfkGvckUpBkMn-A05gtRw6p_hqLWLtHlZXL6FM6eFAw0YPqVMctNtnGNy2dAUMvxyAjQ/exec';

const FEEDBACK_TOKEN = 'skdn273gna';

/** Max characters accepted for the message body (also enforced server-side). */
const FEEDBACK_MAX_MESSAGE_LENGTH = 5000;

export {
    FEEDBACK_ENDPOINT,
    FEEDBACK_TOKEN,
    FEEDBACK_MAX_MESSAGE_LENGTH
};
