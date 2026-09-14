const DEFAULTS = {
  enabled: true,
  mode: "remind",
  matchOn: "to",
  ccList: [],
  watched: []
};

let current = Object.assign({}, DEFAULTS);

function $(id) { return document.getElementById(id); }

// Older versions stored a single ccAddress. Carry it over.
function migrate(config) {
  const c = Object.assign({}, DEFAULTS, config || {});
  if (!Array.isArray(c.ccList)) c.ccList = [];
  if (!c.ccList.length && config && config.ccAddress) {
    c.ccList = [String(config.ccAddress).toLowerCase()];
  }
  if (!Array.isArray(c.watched)) c.watched = [];
  return c;
}

document.addEventListener("DOMContentLoaded", async function () {
  const stored = await browser.storage.local.get("config");
  current = migrate(stored.config);
  render();
  wireUp();
});

function render() {
  $("enabled").checked = current.enabled;
  $(current.mode === "auto" ? "modeAuto" : "modeRemind").checked = true;
  $(current.matchOn === "any" ? "matchAny" : "matchTo").checked = true;
  renderList("copy");
  renderList("watched");
}

function arrayFor(kind) {
  return kind === "copy" ? current.ccList : current.watched;
}

function renderList(kind) {
  const items = arrayFor(kind);
  const list = $(kind === "copy" ? "copyList" : "watchedList");
  const empty = $(kind === "copy" ? "copyEmpty" : "watchedEmpty");

  list.innerHTML = "";
  empty.style.display = items.length ? "none" : "block";

  items.forEach(function (address, index) {
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.textContent = address;

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "\u00d7";
    remove.setAttribute("aria-label", "Remove " + address);
    remove.addEventListener("click", function () {
      items.splice(index, 1);
      renderList(kind);
      setStatus("");
    });

    li.appendChild(label);
    li.appendChild(remove);
    list.appendChild(li);
  });
}

function addTo(kind) {
  const input = $(kind === "copy" ? "copyInput" : "watchedInput");
  const items = arrayFor(kind);
  const value = input.value.trim().toLowerCase();

  if (!value) return;
  if (value.indexOf("@") === -1) { setStatus("That does not look like an email address.", "bad"); return; }
  if (items.indexOf(value) !== -1) { setStatus("Already on the list.", "bad"); return; }

  items.push(value);
  input.value = "";
  renderList(kind);
  setStatus("");
  input.focus();
}

function wireUp() {
  $("addCopy").addEventListener("click", function () { addTo("copy"); });
  $("addWatched").addEventListener("click", function () { addTo("watched"); });

  $("copyInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addTo("copy"); }
  });
  $("watchedInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addTo("watched"); }
  });

  $("save").addEventListener("click", save);
}

async function save() {
  if (!current.ccList.length) {
    setStatus("Add at least one person to copy.", "bad");
    $("copyInput").focus();
    return;
  }
  if (!current.watched.length) {
    setStatus("Add at least one person to watch for.", "bad");
    $("watchedInput").focus();
    return;
  }

  current.enabled = $("enabled").checked;
  current.mode = $("modeAuto").checked ? "auto" : "remind";
  current.matchOn = $("matchAny").checked ? "any" : "to";
  delete current.ccAddress;
  delete current.ccName;

  try {
    await browser.storage.local.set({ config: current });
    setStatus("Saved.", "ok");
  } catch (e) {
    setStatus("Could not save: " + e.message, "bad");
  }
}

function setStatus(text, kind) {
  const el = $("status");
  el.textContent = text;
  el.className = kind || "";
}
