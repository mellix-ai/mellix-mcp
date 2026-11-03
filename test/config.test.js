import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig, ConfigError, DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_THRESHOLD } from "../dist/index.js";

const KEY = "mellix_test_secret_key";

test("defaults: hosted API, myles-g-12b, threshold 0.9", () => {
  const c = loadConfig({ MELLIX_API_KEY: KEY });
  assert.equal(c.apiKey, KEY);
  assert.equal(c.baseURL, "https://api.mellix.com");
  assert.equal(DEFAULT_BASE_URL, "https://api.mellix.com");
  assert.equal(c.model, DEFAULT_MODEL);
  assert.equal(c.model, "myles-g-12b");
  assert.equal(c.threshold, DEFAULT_THRESHOLD);
  assert.equal(c.timeoutMs, 60000);
  assert.equal(c.totalTimeoutMs, 25000);
  assert.equal(c.lockModel, false);
  assert.equal(c.lockThreshold, false);
});

test("MELLIX_API_TOKEN, the SDKs' name, is accepted too; MELLIX_API_KEY wins", () => {
  assert.equal(loadConfig({ MELLIX_API_TOKEN: "t" }).apiKey, "t");
  assert.equal(loadConfig({ MELLIX_API_KEY: "k", MELLIX_API_TOKEN: "t" }).apiKey, "k");
});

test("a missing key is refused without echoing anything secret", () => {
  assert.throws(() => loadConfig({}), (e) => e instanceof ConfigError && /MELLIX_API_KEY/.test(e.message));
  assert.throws(() => loadConfig({ MELLIX_API_KEY: "  " }), ConfigError);
});

test("self-hosted base URL, trailing slash removed", () => {
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_BASE_URL: "https://myles.internal.example/" }).baseURL, "https://myles.internal.example");
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_BASE_URL: "http://127.0.0.1:8000" }).baseURL, "http://127.0.0.1:8000");
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_BASE_URL: "http://localhost:8000/" }).baseURL, "http://localhost:8000");
});

test("plain http to another machine needs MELLIX_ALLOW_HTTP=1", () => {
  const env = { MELLIX_API_KEY: KEY, MELLIX_BASE_URL: "http://10.0.0.5:8000" };
  assert.throws(() => loadConfig(env), (e) => e instanceof ConfigError && !e.message.includes(KEY));
  assert.equal(loadConfig({ ...env, MELLIX_ALLOW_HTTP: "1" }).baseURL, "http://10.0.0.5:8000");
});

test("bad base URLs are refused", () => {
  for (const url of ["not a url", "ftp://x.example", "https://user:pw@x.example", "https://x.example/?a=1"]) {
    assert.throws(() => loadConfig({ MELLIX_API_KEY: KEY, MELLIX_BASE_URL: url }), ConfigError, url);
  }
});

test("model, threshold and timeout are checked", () => {
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_MODEL: "myles-g-31b-20261027" }).model, "myles-g-31b-20261027");
  assert.throws(() => loadConfig({ MELLIX_API_KEY: KEY, MELLIX_MODEL: "Bad Model" }), ConfigError);
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_THRESHOLD: "0.95" }).threshold, 0.95);
  for (const t of ["0.4", "1.1", "", "x"]) {
    assert.throws(() => loadConfig({ MELLIX_API_KEY: KEY, MELLIX_THRESHOLD: t }), ConfigError, t);
  }
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_TIMEOUT_MS: "120000" }).timeoutMs, 120000);
  assert.throws(() => loadConfig({ MELLIX_API_KEY: KEY, MELLIX_TIMEOUT_MS: "5" }), ConfigError);
});

test("MELLIX_TIMEOUT_SECONDS sets the total time for a call, from 1 to 600 seconds", () => {
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_TIMEOUT_SECONDS: "10" }).totalTimeoutMs, 10000);
  assert.equal(loadConfig({ MELLIX_API_KEY: KEY, MELLIX_TIMEOUT_SECONDS: "2.5" }).totalTimeoutMs, 2500);
  for (const t of ["0", "0.5", "601", "", "x", "-5"]) {
    assert.throws(() => loadConfig({ MELLIX_API_KEY: KEY, MELLIX_TIMEOUT_SECONDS: t }), (e) => e instanceof ConfigError && /MELLIX_TIMEOUT_SECONDS/.test(e.message), t);
  }
});

test("MELLIX_LOCK_MODEL and MELLIX_LOCK_THRESHOLD take 1/true or 0/false; anything else is refused", () => {
  const on = loadConfig({ MELLIX_API_KEY: KEY, MELLIX_LOCK_MODEL: "1", MELLIX_LOCK_THRESHOLD: "true" });
  assert.equal(on.lockModel, true);
  assert.equal(on.lockThreshold, true);
  const off = loadConfig({ MELLIX_API_KEY: KEY, MELLIX_LOCK_MODEL: "0", MELLIX_LOCK_THRESHOLD: "false" });
  assert.equal(off.lockModel, false);
  assert.equal(off.lockThreshold, false);
  for (const name of ["MELLIX_LOCK_MODEL", "MELLIX_LOCK_THRESHOLD"]) {
    assert.throws(() => loadConfig({ MELLIX_API_KEY: KEY, [name]: "yes" }), (e) => e instanceof ConfigError && e.message.includes(name));
  }
});
