const params = new URLSearchParams(location.search);
const missing = (params.get("missing") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);

const list = document.getElementById("missing");
missing.forEach(function (address) {
  const li = document.createElement("li");
  li.textContent = address;
  list.appendChild(li);
});

document.getElementById("count").textContent =
  missing.length === 1 ? "one person is" : missing.length + " people are";

let sent = false;

function choose(choice) {
  if (sent) return;
  sent = true;

  const done = function () { window.close(); };

  try {
    const sending = browser.runtime.sendMessage({ choice: choice });
    if (sending && typeof sending.then === "function") {
      sending.then(done, done);
    } else {
      done();
    }
  } catch (e) {
    done();
  }
}

document.getElementById("add").addEventListener("click", function () { choose("add"); });
document.getElementById("send").addEventListener("click", function () { choose("send"); });
document.getElementById("cancel").addEventListener("click", function () { choose("cancel"); });

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") choose("cancel");
});

document.getElementById("add").focus();
