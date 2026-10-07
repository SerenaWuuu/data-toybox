/* Data Toybox - shared UI: tabs, toast, easter egg */
(function () {
  "use strict";

  // ---- Toast ----
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  window.showToast = function (msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2400);
  };

  // ---- Tabs ----
  var tabBtns = Array.prototype.slice.call(document.querySelectorAll(".tab-btn"));
  function activateTab(name) {
    tabBtns.forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === name);
    });
    document.querySelectorAll(".tool-panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "panel-" + name);
    });
    if (name === "csv" && window.ToyboxCSV && typeof window.ToyboxCSV.onShow === "function") {
      window.ToyboxCSV.onShow();
    }
  }
  tabBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      activateTab(b.getAttribute("data-tab"));
    });
  });

  // ---- Clipboard helper with fallback ----
  window.copyText = function (text) {
    function done(ok) {
      window.showToast(ok ? "Copied. Go paste it somewhere impressive." : "Copy failed. Your browser said no.");
    }
    if (navigator.clipboard && window.isSecureContext !== false) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () {
        fallback();
      });
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        done(document.execCommand("copy"));
      } catch (e) {
        done(false);
      }
      document.body.removeChild(ta);
    }
  };

  // ---- Easter egg: click the teddy 7 times ----
  var clicks = 0;
  var quips = [
    "The teddy approves of your data curiosity.",
    "Still clicking? Bold strategy.",
    "Okay, you found the secret: there is no secret. But nice persistence.",
    "Fun fact: this toybox has never lost a CSV. Yet.",
    "You really like this bear, huh."
  ];
  document.getElementById("heroEmoji").addEventListener("click", function () {
    clicks += 1;
    if (clicks >= 7) {
      var q = quips[Math.min(clicks - 7, quips.length - 1)];
      window.showToast("🧸 " + q);
      if (clicks - 7 >= quips.length) clicks = 6;
    }
  });
  console.log("%c🧸 Data Toybox: no cookies were harmed in the making of this page.", "font-size:14px;");
})();
