# Changelog

## 0.0.2

- The hosted API's address is `https://api.mellix.com`. The server set no address of its own and took the `mellix` 0.0.1 SDK's default, `https://api.mellix.ai`, on a domain Mellix does not own; without `MELLIX_BASE_URL` it now calls `https://api.mellix.com`. The README is corrected to match.
- `MELLIX_TIMEOUT_SECONDS` (default 25): the most one tool call may take in all, retries and the waits between them included. Past it the call ends with an error of type `timeout`, the request in flight is aborted and no retry is sent. Before, retries could keep a call going for over a minute, past hosts that stop a tool call after 30 seconds.
- `MELLIX_LOCK_MODEL=1` and `MELLIX_LOCK_THRESHOLD=1` keep the model and the threshold with the operator: `decide` no longer offers `model` or `threshold` (for the call or for a question), and a call that sends one anyway is refused with an error of type `setting_locked`.
- A question without `instructions` is still refused (the API requires them), now with a message that says what to send; the tool description and the README say so too.
- The package homepage on npm, the README's docs and contact links, and the console address in the missing-key error now go to mellix.com (`https://mellix.com/docs`, `https://mellix.com/contact`, `https://console.mellix.com`). They pointed at mellix.ai, which does not exist.

## 0.0.1

First release of the Mellix MCP server.

- `decide`: a state (text or JSON) and one or more yes/no, choice or score questions; each answer gives the pick, its probability, every option's probability, whether it cleared the threshold, whether the model abstained ("I don't know"), and an `escalate` flag for answers a person should see.
- Thresholds from `MELLIX_THRESHOLD` (default 0.9), per call or per question.
- `chunk: true` reads a long text in overlapping windows for yes/no questions and answers with the window most likely to be yes (at most 20 windows, each billed as its own request).
- Clear tool errors for a missing or refused key, no credit, a retired build (naming its successor), a state too long for the context window (suggesting chunking) and rate limits.
- `list_models` and `health`.
- Configuration from `MELLIX_API_KEY` (or `MELLIX_API_TOKEN`), `MELLIX_BASE_URL` for self-hosted deployments, `MELLIX_MODEL` (default `myles-g-12b`) and `MELLIX_TIMEOUT_MS`. Plain `http://` only to the same machine unless `MELLIX_ALLOW_HTTP=1`.
- Built on the `mellix` JavaScript SDK 0.0.1: retries with one idempotency key per call, so a retried decision is never billed twice.
