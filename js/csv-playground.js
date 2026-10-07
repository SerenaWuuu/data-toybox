/* Data Toybox - CSV Playground: parse, preview, chart */
(function () {
  "use strict";

  var state = {
    rows: [],
    fields: [],
    types: {},
    chart: null,
    chartType: null,
    suggested: null
  };

  var PALETTE = ["#0e9f8a", "#ff6b5e", "#f5a623", "#7c6cf0", "#3aa7e0", "#e06ca8", "#8ac926", "#ff8c42"];

  var dropzone = document.getElementById("dropzone");
  var fileInput = document.getElementById("fileInput");
  var sampleBtn = document.getElementById("sampleBtn");
  var loadingEl = document.getElementById("csvLoading");
  var errorEl = document.getElementById("csvError");
  var resultsEl = document.getElementById("csvResults");
  var emptyEl = document.getElementById("csvEmpty");
  var previewTable = document.getElementById("previewTable");
  var csvMeta = document.getElementById("csvMeta");
  var xSelect = document.getElementById("xSelect");
  var ySelect = document.getElementById("ySelect");
  var chartBox = document.getElementById("chartBox");
  var chips = Array.prototype.slice.call(document.querySelectorAll("#chartChips .chip"));

  var SAMPLE_CSV = "month,category,revenue,orders\n" +
    "2026-01,Cat toys,12400,310\n" +
    "2026-02,Cat toys,13850,342\n" +
    "2026-03,Cat toys,11200,289\n" +
    "2026-01,Dog treats,9800,410\n" +
    "2026-02,Dog treats,15200,522\n" +
    "2026-03,Dog treats,14100,498\n" +
    "2026-01,Bird seed,3200,150\n" +
    "2026-02,Bird seed,2900,132\n" +
    "2026-03,Bird seed,4100,178\n" +
    "2026-01,Aquarium,7600,95\n" +
    "2026-02,Aquarium,8200,101\n" +
    "2026-03,Aquarium,7900,98\n";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showOnly(el) {
    [loadingEl, errorEl, resultsEl, emptyEl].forEach(function (e) {
      e.classList.add("hidden");
    });
    if (el) el.classList.remove("hidden");
  }

  function fail(msg) {
    errorEl.innerHTML = '<span class="big">🙈</span>' + esc(msg);
    showOnly(errorEl);
  }

  function startParse(text, fileName) {
    if (typeof Papa === "undefined") {
      fail("The CSV parser did not load. Check your connection and refresh, it is probably just shy.");
      return;
    }
    showOnly(loadingEl);
    setTimeout(function () {
      var res;
      try {
        res = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
      } catch (e) {
        fail("I tripped while reading that file. Make sure it is actually a CSV and try again.");
        return;
      }
      var fatal = (res.errors || []).filter(function (e) { return e.type === "Quotes" || e.code === "UndetectableDelimiter"; });
      if ((!res.data || res.data.length === 0) && (!res.meta.fields || res.meta.fields.length === 0)) {
        fail("That file looks empty or not CSV shaped. Peek inside it and make sure there are commas doing their job.");
        return;
      }
      if (fatal.length > 0 && (!res.data || res.data.length === 0)) {
        fail("The quotes in that file are mismatched, so the parser gave up. Fix the quoting and try again.");
        return;
      }
      ingest(res.data, res.meta.fields || [], fileName);
    }, 60);
  }

  function detectTypes(rows, fields) {
    var types = {};
    var sample = rows.slice(0, 200);
    fields.forEach(function (f) {
      var nums = 0, dates = 0, seen = 0;
      sample.forEach(function (r) {
        var v = r[f];
        if (v === null || v === undefined || v === "") return;
        seen += 1;
        if (typeof v === "number" && isFinite(v)) { nums += 1; return; }
        if (typeof v === "boolean") return;
        var s = String(v).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)) {
          var t = Date.parse(s);
          if (!isNaN(t)) { dates += 1; return; }
        }
      });
      if (seen === 0) { types[f] = "text"; return; }
      if (nums / seen >= 0.8) types[f] = "number";
      else if (dates / seen >= 0.8) types[f] = "date";
      else types[f] = "text";
    });
    return types;
  }

  function numVal(v) {
    var n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
    return isFinite(n) ? n : null;
  }

  function distinctCount(rows, f) {
    var s = {};
    rows.forEach(function (r) { s[String(r[f])] = 1; });
    return Object.keys(s).length;
  }

  function ingest(rows, fields, fileName) {
    fields = fields.filter(function (f) { return f !== "__parsed_extra"; });
    if (fields.length === 0) {
      fail("No columns found. A CSV without columns is just a sad text file.");
      return;
    }
    state.rows = rows;
    state.fields = fields;
    state.types = detectTypes(rows, fields);

    // Preview table
    var html = "<thead><tr>";
    fields.forEach(function (f) {
      html += "<th>" + esc(f) + '<span class="type-tag">' + state.types[f] + "</span></th>";
    });
    html += "</tr></thead><tbody>";
    rows.slice(0, 8).forEach(function (r) {
      html += "<tr>";
      fields.forEach(function (f) { html += "<td>" + esc(r[f]) + "</td>"; });
      html += "</tr>";
    });
    html += "</tbody>";
    previewTable.innerHTML = html;
    csvMeta.textContent = rows.length + " rows and " + fields.length + " columns" +
      (fileName ? ", straight out of " + fileName : "") + ". Showing the first 8 rows above.";

    // Axis selects
    var nums = fields.filter(function (f) { return state.types[f] === "number"; });
    var cats = fields.filter(function (f) { return state.types[f] !== "number"; });
    var dates = fields.filter(function (f) { return state.types[f] === "date"; });
    xSelect.innerHTML = "";
    ySelect.innerHTML = "";
    cats.concat(nums).forEach(function (f) {
      var o = document.createElement("option");
      o.value = f; o.textContent = f + " (" + state.types[f] + ")";
      xSelect.appendChild(o);
    });
    nums.forEach(function (f) {
      var o = document.createElement("option");
      o.value = f; o.textContent = f;
      ySelect.appendChild(o);
    });
    var defX = dates[0] || cats[0] || fields[0];
    var defY = nums[0] || fields[0];
    if (defX) xSelect.value = defX;
    if (defY) ySelect.value = defY;

    // Suggestion
    var s;
    if (dates.length > 0 && nums.length > 0) s = "line";
    else if (nums.length >= 2) s = "scatter";
    else if (cats.length > 0 && nums.length > 0) {
      s = distinctCount(rows, cats[0]) <= 8 ? "pie" : "bar";
    } else s = "bar";
    state.suggested = s;
    chips.forEach(function (c) {
      var t = c.getAttribute("data-chart");
      c.classList.toggle("active", t === s);
      var base = c.textContent.replace(/^★\s*/, "");
      c.textContent = (t === s ? "★ " : "") + base;
    });
    state.chartType = s;

    showOnly(resultsEl);
    renderChart();
    window.showToast("Data loaded. Charts are ready when you are.");
  }

  function aggregate(rows, xF, yF, topN) {
    var map = {};
    rows.forEach(function (r) {
      var n = numVal(r[yF]);
      if (n === null) return;
      var k = String(r[xF] == null ? "(blank)" : r[xF]);
      map[k] = (map[k] || 0) + n;
    });
    var entries = Object.keys(map).map(function (k) { return { k: k, v: map[k] }; });
    entries.sort(function (a, b) { return b.v - a.v; });
    if (topN && entries.length > topN) {
      var rest = entries.slice(topN).reduce(function (s, e) { return s + e.v; }, 0);
      entries = entries.slice(0, topN);
      entries.push({ k: "Other", v: rest });
    }
    return entries;
  }

  function baseOption(title) {
    return {
      title: { text: title, left: "center", textStyle: { fontSize: 14, color: "#23272f" } },
      color: PALETTE,
      tooltip: { trigger: "axis" },
      grid: { left: 8, right: 12, bottom: 8, top: 44, containLabel: true },
      animationDuration: 600
    };
  }

  function renderChart() {
    if (typeof echarts === "undefined") {
      fail("The chart library did not load. Check your connection and refresh.");
      return;
    }
    var rows = state.rows;
    if (!rows.length) return;
    var xF = xSelect.value, yF = ySelect.value, t = state.chartType;
    if (state.chart) { state.chart.dispose(); }
    state.chart = echarts.init(chartBox);
    var opt;
    if (t === "bar") {
      var entries = aggregate(rows, xF, yF, 12).reverse();
      opt = baseOption(xF + " vs " + yF);
      opt.xAxis = { type: "value" };
      opt.yAxis = { type: "category", data: entries.map(function (e) { return e.k; }) };
      opt.series = [{ type: "bar", data: entries.map(function (e) { return e.v; }),
        itemStyle: { borderRadius: [0, 6, 6, 0] }, label: { show: entries.length <= 12, position: "right", fontSize: 10 } }];
    } else if (t === "line") {
      var pts = aggregate(rows, xF, yF, 0);
      if (state.types[xF] === "date") {
        pts.sort(function (a, b) { return Date.parse(a.k) - Date.parse(b.k); });
      }
      pts = pts.slice(0, 60);
      opt = baseOption(xF + " over time-ish");
      opt.tooltip = { trigger: "axis" };
      opt.xAxis = { type: "category", data: pts.map(function (e) { return e.k; }), axisLabel: { rotate: 30, fontSize: 10 } };
      opt.yAxis = { type: "value" };
      opt.series = [{ type: "line", data: pts.map(function (e) { return e.v; }), smooth: true, symbolSize: 6,
        lineStyle: { width: 3 }, areaStyle: { opacity: 0.12 } }];
    } else if (t === "pie") {
      var slices = aggregate(rows, xF, yF, 8);
      opt = baseOption("Share of " + yF + " by " + xF);
      opt.tooltip = { trigger: "item" };
      opt.series = [{ type: "pie", radius: ["42%", "70%"],
        data: slices.map(function (e) { return { name: e.k, value: e.v }; }),
        label: { fontSize: 11 }, itemStyle: { borderColor: "#fff", borderWidth: 2 } }];
    } else {
      var xNums = state.fields.filter(function (f) { return state.types[f] === "number"; });
      var sx = xNums.indexOf(xF) >= 0 ? xF : xNums[0];
      var sy = xNums.indexOf(yF) >= 0 ? yF : (xNums[1] || xNums[0]);
      var data = [];
      rows.slice(0, 600).forEach(function (r) {
        var a = numVal(r[sx]), b = numVal(r[sy]);
        if (a !== null && b !== null) data.push([a, b]);
      });
      opt = baseOption(sx + " vs " + sy);
      opt.xAxis = { type: "value", name: sx, nameLocation: "middle", nameGap: 28 };
      opt.yAxis = { type: "value", name: sy };
      opt.series = [{ type: "scatter", data: data, symbolSize: 9, itemStyle: { opacity: 0.75 } }];
      opt.tooltip = { trigger: "item" };
    }
    state.chart.setOption(opt);
  }

  // ---- Events ----
  dropzone.addEventListener("click", function (e) {
    if (e.target === sampleBtn) return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });
  ["dragover", "dragenter"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add("dragging"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove("dragging"); });
  });
  dropzone.addEventListener("drop", function (e) {
    var f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) readFile(f);
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) readFile(fileInput.files[0]);
    fileInput.value = "";
  });
  sampleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    startParse(SAMPLE_CSV, "sample pet shop data");
  });

  function readFile(f) {
    if (!/\.csv$/i.test(f.name) && f.type !== "text/csv") {
      fail("That is a ." + (f.name.split(".").pop() || "mystery") + " file. I only speak CSV, sorry.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () { startParse(String(reader.result), f.name); };
    reader.onerror = function () { fail("Could not read that file. It might be locked or corrupted."); };
    reader.readAsText(f);
  }

  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      state.chartType = c.getAttribute("data-chart");
      chips.forEach(function (x) {
        var isActive = x === c;
        x.classList.toggle("active", isActive);
        var base = x.textContent.replace(/^★\s*/, "");
        x.textContent = (x.getAttribute("data-chart") === state.suggested ? "★ " : "") + base;
      });
      renderChart();
    });
  });
  xSelect.addEventListener("change", renderChart);
  ySelect.addEventListener("change", renderChart);

  document.getElementById("pngBtn").addEventListener("click", function () {
    if (!state.chart) return;
    try {
      var url = state.chart.getDataURL({ pixelRatio: 2, backgroundColor: "#ffffff" });
      var a = document.createElement("a");
      a.href = url;
      a.download = "toybox-chart-" + state.chartType + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.showToast("Chart saved. Frame it, or just Slack it.");
    } catch (e) {
      window.showToast("Could not export the PNG. The chart is shy today.");
    }
  });

  window.addEventListener("resize", function () {
    if (state.chart) state.chart.resize();
  });

  window.ToyboxCSV = {
    onShow: function () { if (state.chart) state.chart.resize(); }
  };
})();
