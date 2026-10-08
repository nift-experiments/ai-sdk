import { getMessageSources } from "./message-sources";
import { getMessageMarkdown } from "./message-text";
/** Longest question or answer text sent with Ask AI feedback. */
export const CHAT_FEEDBACK_TEXT_LIMIT = 4000;
/** Most source URLs sent with Ask AI feedback. */
export const CHAT_FEEDBACK_SOURCE_LIMIT = 10;
/** The feedback service rejects `url` values over 1,024 characters. */
export const CHAT_FEEDBACK_URL_LIMIT = 1024;
/** The feedback service rejects `note` values over 16,384 characters. */
export const CHAT_FEEDBACK_NOTE_LIMIT = 16_384;
/** First line of every Ask AI feedback note, for feedback triage. */
export const CHAT_FEEDBACK_NOTE_PREFIX = "[Ask AI]";
export const CHAT_FEEDBACK_EMOJI = {
    up: "👍",
    down: "👎",
};
const ELLIPSIS = "…";
const BACKTICK_RUN_PATTERN = /`+/g;
const WHITESPACE_PATTERN = /\s+/g;
/** Characters that could start Markdown, mentions, or HTML in the summary. */
const SUMMARY_MARKUP_PATTERN = /[`*_~[\]()!<>@#|\\]/g;
/** A source rendered in an inline code span must not be able to leave it. */
const UNSAFE_SOURCE_PATTERN = /[\s`<>]/;
/**
 * Longest question summary in the note's first line. The feedback service
 * titles the issue with the note's first ten words.
 */
const CHAT_FEEDBACK_SUMMARY_LIMIT = 80;
const isHighSurrogate = (code) => code >= 0xd8_00 && code <= 0xdb_ff;
/**
 * Shorten `value` to at most `limit` characters, ending with an ellipsis
 * when shortened. Never splits a surrogate pair.
 */
export const capText = (value, limit) => {
    if (value.length <= limit) {
        return value;
    }
    let end = Math.max(0, limit - ELLIPSIS.length);
    if (end > 0 && isHighSurrogate(value.charCodeAt(end - 1))) {
        end -= 1;
    }
    return `${value.slice(0, end)}${ELLIPSIS}`;
};
export const isChatMessageFeedbackVote = (value) => value === "up" || value === "down";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/** The vote stored on a message by `withMessageFeedbackVote`, if any. */
export const readMessageFeedbackVote = (message) => {
    const vote = isRecord(message.metadata)
        ? message.metadata.feedback
        : undefined;
    return isChatMessageFeedbackVote(vote) ? vote : undefined;
};
/**
 * Record `vote` in the metadata of the message with `messageId`, keeping
 * every other metadata key (such as the eve stream position) so the vote
 * persists with stored chat history without changing later chat requests.
 */
export const withMessageFeedbackVote = (messages, messageId, vote) => messages.map((message) => message.id === messageId
    ? {
        ...message,
        metadata: {
            ...(isRecord(message.metadata) ? message.metadata : {}),
            feedback: vote,
        },
    }
    : message);
const isPageContextMessage = (message) => isRecord(message.metadata) && message.metadata.isPageContext === true;
/**
 * The question an assistant message answers: the closest earlier user
 * message, skipping page-context messages the chat route also ignores.
 */
const getAnsweredQuestion = (messages, answerIndex) => {
    for (let index = answerIndex - 1; index >= 0; index--) {
        const message = messages[index];
        if (message?.role === "user" && !isPageContextMessage(message)) {
            return getMessageMarkdown(message);
        }
    }
    return "";
};
const isRootRelativePath = (value) => typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\");
/** Sources are HTTP(S) URLs or site paths with no whitespace or markup. */
const isFeedbackSource = (value) => {
    if (typeof value !== "string" || UNSAFE_SOURCE_PATTERN.test(value)) {
        return false;
    }
    if (isRootRelativePath(value)) {
        return true;
    }
    try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
    }
    catch {
        return false;
    }
};
/**
 * Validate and cap feedback before it crosses a trust boundary. Server
 * actions accept arbitrary input, so the server re-runs this on whatever the
 * browser sent. Returns `null` for input that is not answer feedback.
 */
export const normalizeChatMessageFeedback = (input) => {
    if (!isRecord(input)) {
        return null;
    }
    const { answer, pageUrl, question, sources, vote } = input;
    if (!isChatMessageFeedbackVote(vote) ||
        typeof answer !== "string" ||
        !answer.trim() ||
        !isRootRelativePath(pageUrl)) {
        return null;
    }
    return {
        answer: capText(answer.trim(), CHAT_FEEDBACK_TEXT_LIMIT),
        // A truncated path still names the page; an ellipsis would not.
        pageUrl: pageUrl.slice(0, CHAT_FEEDBACK_URL_LIMIT),
        question: typeof question === "string"
            ? capText(question.trim(), CHAT_FEEDBACK_TEXT_LIMIT)
            : "",
        sources: Array.isArray(sources)
            ? Array.from(new Set(sources
                .map((source) => typeof source === "string" ? source.trim() : source)
                .filter(isFeedbackSource)))
                .slice(0, CHAT_FEEDBACK_SOURCE_LIMIT)
                .map((source) => capText(source, CHAT_FEEDBACK_URL_LIMIT))
            : [],
        vote,
    };
};
/**
 * Collect feedback for the assistant message with `messageId`. Returns
 * `null` when the message is missing, is not an assistant message, or has no
 * text to rate.
 */
export const buildChatMessageFeedback = ({ messageId, messages, pageUrl, vote, }) => {
    const index = messages.findIndex((message) => message.id === messageId);
    const message = messages[index];
    if (message?.role !== "assistant") {
        return null;
    }
    return normalizeChatMessageFeedback({
        answer: getMessageMarkdown(message),
        pageUrl,
        question: getAnsweredQuestion(messages, index),
        sources: getMessageSources(message.parts).map((source) => source.url),
        vote,
    });
};
/**
 * Fence `text` as a code block whose fence is longer than any backtick run
 * inside it, so the text renders verbatim: Markdown, @-mentions, and images
 * in a question or answer stay inert in the triage issue. The summary line
 * drops markup characters and sources render as inline code instead.
 */
const fence = (text, language) => {
    const longestRun = Math.max(0, ...Array.from(text.matchAll(BACKTICK_RUN_PATTERN), ([run]) => run.length));
    const marker = "`".repeat(Math.max(3, longestRun + 1));
    return `${marker}${language}\n${text}\n${marker}`;
};
/**
 * The `note` sent to the feedback service. Its first line starts with
 * `CHAT_FEEDBACK_NOTE_PREFIX` and the vote emoji, so triage can tell Ask AI
 * feedback from page feedback, then summarizes the question on one line
 * because the service titles the issue with the note's first words. The
 * answer comes last so the note limit can only ever shorten the answer.
 */
export const formatChatMessageFeedbackNote = (feedback) => {
    const emoji = CHAT_FEEDBACK_EMOJI[feedback.vote];
    const verdict = feedback.vote === "up" ? "Helpful" : "Not helpful";
    const summary = capText(feedback.question
        .replace(SUMMARY_MARKUP_PATTERN, "")
        .replace(WHITESPACE_PATTERN, " ")
        .trim(), CHAT_FEEDBACK_SUMMARY_LIMIT);
    const sections = [
        `${CHAT_FEEDBACK_NOTE_PREFIX} ${emoji} ${summary || `${verdict} answer`}`,
        `**Vote:** ${verdict}`,
        `**Question**\n\n${feedback.question ? fence(feedback.question, "text") : "_No question found._"}`,
        `**Sources**\n\n${feedback.sources.length > 0
            ? feedback.sources.map((source) => `- \`${source}\``).join("\n")
            : "_No sources shown._"}`,
        `**Answer**\n\n${fence(feedback.answer, "md")}`,
    ];
    return capText(sections.join("\n\n"), CHAT_FEEDBACK_NOTE_LIMIT);
};
