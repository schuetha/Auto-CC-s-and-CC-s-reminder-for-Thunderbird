/*
 * Cc rules — runs when you press Send in Thunderbird.
 *
 * compose.onBeforeSend hands us the draft's recipients and lets us change
 * them before the message leaves. Settings come from the options page.
 */

const DEFAULTS = {
  enabled: true,
  mode: "remind",     // "remind" | "auto"
  matchOn: "to",      // "to" | "any"
  ccList: [],
  watched: []
};

// Strip everything that cannot belong in an email address
function cleanAddress(s) {
  return String(s || "")
    .normalize("NFKC")   // fullwidth ＠ａ → @a
    .replace(/[\p{C}\p{Z}\s\uFFFC\uFFFD\uFE00-\uFE0F\u3164\u115F\u1160\uFFA0\u2800]/gu, "")
    .replace(/^mailto:/i, "")
    .toLowerCase();
}

function migrate(config) {
  const c = Object.assign({}, DEFAULTS, config || {});
  if (!Array.isArray(c.ccList)) c.ccList = [];
  if (!c.ccList.length && config && config.ccAddress) {
    c.ccList = [String(config.ccAddress).toLowerCase()];
  }
  if (!Array.isArray(c.watched)) c.watched = [];
  c.ccList = c.ccList.map(cleanAddress);
  c.watched = c.watched.map(cleanAddress);
  return c;
}

async function getConfig() {
  const stored = await browser.storage.local.get("config");
  return migrate(stored.config);
}

// Recipients arrive either as "Name <a@b.c>" strings or as objects.
function addressOf(recipient) {
  if (!recipient) return "";
  const text = typeof recipient === "string" ? recipient : (recipient.address || "");
  const angled = text.match(/<([^>]+)>/);
  return cleanAddress(angled ? angled[1] : text);
}

/* ---- the reminder popup ------------------------------------------------ */

let pending = null;

function askUser(missing) {
  return new Promise(function (resolve) {
    const params = new URLSearchParams({ missing: missing.join(", ") });

    browser.windows.create({
      url: "prompt.html?" + params.toString(),
      type: "popup",
      width: 460,
      height: 300
    }).then(function (win) {
      pending = { resolve: resolve, windowId: win.id, settled: false };
    }).catch(function () {
      resolve("send");   // if the popup cannot open, do not trap the message
    });
  });
}

browser.runtime.onMessage.addListener(function (message) {
  if (!pending || pending.settled) return;
  if (message && message.choice) {
    pending.settled = true;
    const done = pending.resolve;
    const winId = pending.windowId;
    pending = null;

    setTimeout(function () {
      browser.windows.remove(winId).catch(function () {});
    }, 300);

    done(message.choice);
  }
});

browser.windows.onRemoved.addListener(function (windowId) {
  if (pending && !pending.settled && pending.windowId === windowId) {
    pending.settled = true;
    const done = pending.resolve;
    pending = null;
    done("cancel");
  }
});

/* ---- the send hook ----------------------------------------------------- */

browser.compose.onBeforeSend.addListener(async function (tab, details) {
  let config;
  try {
    config = await getConfig();
  } catch (e) {
    return {};
  }

  if (!config.enabled || !config.ccList.length || !config.watched.length) return {};

  const to = (details.to || []).map(addressOf);
  const cc = (details.cc || []).map(addressOf);
  const bcc = (details.bcc || []).map(addressOf);
  const everyone = to.concat(cc).concat(bcc);

  const watched = config.watched.map(cleanAddress);
  const searchIn = config.matchOn === "any" ? everyone : to;
  const matched = searchIn.some(function (a) { return watched.indexOf(a) !== -1; });

  if (!matched) return {};

  // Only the people not already on the message.
  const missing = config.ccList
    .map(cleanAddress)
    .filter(function (a) { return everyone.indexOf(a) === -1; });

  if (!missing.length) return {};

  const newCc = (details.cc || []).concat(missing);

  if (config.mode === "auto") {
    return { details: { cc: newCc } };
  }

  const choice = await askUser(missing);

  if (choice === "add") return { details: { cc: newCc } };
  if (choice === "send") return {};
  return { cancel: true };
});
