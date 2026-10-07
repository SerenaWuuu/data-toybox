/* Data Toybox - SQL Shine: format SQL beautifully */
(function () {
  "use strict";

  var input = document.getElementById("sqlInput");
  var dialectSelect = document.getElementById("dialectSelect");
  var formatBtn = document.getElementById("formatBtn");
  var copyBtn = document.getElementById("sqlCopyBtn");
  var clearBtn = document.getElementById("sqlClearBtn");
  var stats = document.getElementById("sqlStats");
  var errorEl = document.getElementById("sqlError");

  function updateStats() {
    var text = input.value;
    var chars = text.length;
    var lines = text === "" ? 0 : text.split("\n").length;
    var words = (text.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).length;
    stats.textContent = chars + " characters, " + lines + " lines, " + words + " words. " +
      (chars === 0 ? "A blank canvas." : chars < 60 ? "Just getting warmed up." : "Now that is a query with ambitions.");
  }

  function hideError() { errorEl.classList.add("hidden"); }

  function shine() {
    hideError();
    var sql = input.value.trim();
    if (!sql) {
      errorEl.innerHTML = '<span class="big">🫧</span>Paste some SQL first. I cannot polish thin air, much as I would like to.';
      errorEl.classList.remove("hidden");
      return;
    }
    if (typeof sqlFormatter === "undefined") {
      errorEl.innerHTML = '<span class="big">🔌</span>The formatter library did not load. Check your connection and refresh.';
      errorEl.classList.remove("hidden");
      return;
    }
    try {
      var out = sqlFormatter.format(sql, { dialect: dialectSelect.value });
      input.value = out;
      updateStats();
      window.showToast("Shiny. Your future self says thanks.");
    } catch (e) {
      errorEl.innerHTML = '<span class="big">🤔</span>Hmm, the formatter choked on that. It might not be valid SQL, or it uses syntax this dialect does not know. Error detail: ' +
        String((e && e.message) || e).replace(/</g, "&lt;").slice(0, 220);
      errorEl.classList.remove("hidden");
    }
  }

  formatBtn.addEventListener("click", shine);
  dialectSelect.addEventListener("change", function () {
    if (input.value.trim()) shine();
  });
  input.addEventListener("input", updateStats);
  input.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); shine(); }
  });
  copyBtn.addEventListener("click", function () {
    if (!input.value) { window.showToast("Nothing to copy yet. The textarea is empty."); return; }
    window.copyText(input.value);
  });
  clearBtn.addEventListener("click", function () {
    input.value = "";
    updateStats();
    hideError();
    input.focus();
  });

  updateStats();
})();
