/* Data Toybox - NL to SQL: rule-based SELECT composer */
(function () {
  "use strict";

  var tableEl = document.getElementById("nlTable");
  var colsEl = document.getElementById("nlCols");
  var aggEl = document.getElementById("nlAgg");
  var aggColEl = document.getElementById("nlAggCol");
  var groupEl = document.getElementById("nlGroup");
  var limitEl = document.getElementById("nlLimit");
  var orderColEl = document.getElementById("nlOrderCol");
  var orderDirEl = document.getElementById("nlOrderDir");
  var outEl = document.getElementById("nlOut");
  var filterList = document.getElementById("filterList");

  function ident(s) {
    s = String(s == null ? "" : s).trim().replace(/`/g, "");
    if (s === "") return "";
    if (/^[A-Za-z_][A-Za-z0-9_$.]*$/.test(s)) return s;
    return "`" + s + "`";
  }

  function literal(v) {
    var s = String(v == null ? "" : v).trim();
    if (s === "") return "''";
    if (/^-?\d+(\.\d+)?$/.test(s)) return s;
    if (/^(true|false|null)$/i.test(s)) return s.toUpperCase();
    return "'" + s.replace(/'/g, "''") + "'";
  }

  function addFilterRow() {
    var row = document.createElement("div");
    row.className = "filter-row";
    var ops = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "IS NULL", "IS NOT NULL"];
    var sel = '<select class="f-op">' + ops.map(function (o) {
      return '<option value="' + o + '">' + o + "</option>";
    }).join("") + "</select>";
    row.innerHTML =
      '<input type="text" class="f-col" placeholder="column" autocomplete="off" spellcheck="false">' +
      sel +
      '<input type="text" class="f-val" placeholder="value" autocomplete="off" spellcheck="false">' +
      '<button type="button" class="icon-btn f-del" title="Remove filter">×</button>';
    filterList.appendChild(row);
    row.querySelector(".f-del").addEventListener("click", function () {
      row.remove();
      compose();
    });
    row.querySelector(".f-col").focus();
  }

  function buildWhere() {
    var parts = [];
    Array.prototype.forEach.call(filterList.querySelectorAll(".filter-row"), function (row) {
      var col = ident(row.querySelector(".f-col").value);
      var op = row.querySelector(".f-op").value;
      var val = row.querySelector(".f-val").value;
      if (!col) return;
      if (op === "IS NULL" || op === "IS NOT NULL") {
        parts.push(col + " " + op);
      } else if (op === "IN") {
        var vals = String(val).split(",").map(function (x) { return literal(x); }).filter(function (x) { return x !== "''"; });
        if (vals.length) parts.push(col + " IN (" + vals.join(", ") + ")");
      } else {
        parts.push(col + " " + op + " " + literal(val));
      }
    });
    return parts;
  }

  function compose() {
    var table = ident(tableEl.value);
    if (!table) {
      outEl.value = "-- Name a table above and I will start building your query.";
      return;
    }
    var cols = String(colsEl.value).split(",").map(function (c) { return c.trim(); }).filter(Boolean);
    var plainCols = cols.map(function (c) { return c === "*" ? "*" : ident(c); }).filter(Boolean);
    var agg = aggEl.value;
    var aggCol = ident(aggColEl.value);

    var selectList;
    if (agg && aggCol) {
      var alias = (agg + "_" + aggCol).toLowerCase().replace(/[^a-z0-9_]/g, "_");
      var aggExpr = agg + "(" + (agg === "COUNT" && (aggCol === "*" || !aggColEl.value.trim()) ? "*" : aggCol) + ") AS " + alias;
      if (plainCols.length && !(plainCols.length === 1 && plainCols[0] === "*")) {
        selectList = plainCols.join(", ") + ", " + aggExpr;
      } else {
        selectList = aggExpr;
      }
    } else if (plainCols.length) {
      selectList = plainCols.join(", ");
    } else {
      selectList = "*";
    }

    var sql = "SELECT " + selectList + "\nFROM " + table;

    var where = buildWhere();
    if (where.length) sql += "\nWHERE " + where.join("\n  AND ");

    var group = ident(groupEl.value);
    var autoGroup = "";
    if (agg && aggCol && plainCols.length && !(plainCols.length === 1 && plainCols[0] === "*") && !group) {
      autoGroup = plainCols.join(", ");
    }
    var groupBy = group || autoGroup;
    if (groupBy) sql += "\nGROUP BY " + groupBy;

    var orderCol = ident(orderColEl.value);
    if (orderCol) sql += "\nORDER BY " + orderCol + " " + orderDirEl.value;

    var limit = parseInt(String(limitEl.value).trim(), 10);
    if (isFinite(limit) && limit > 0) sql += "\nLIMIT " + limit;

    outEl.value = sql + ";";
  }

  document.getElementById("addFilterBtn").addEventListener("click", addFilterRow);
  document.getElementById("nlCopyBtn").addEventListener("click", function () {
    var q = outEl.value;
    if (!q || q.indexOf("-- Name a table") === 0) {
      window.showToast("Build a query first, then copy it.");
      return;
    }
    window.copyText(q);
  });

  ["input", "change"].forEach(function (ev) {
    document.getElementById("panel-nl").addEventListener(ev, function (e) {
      if (e.target && (e.target.id === "nlCopyBtn" || e.target.classList.contains("f-del"))) return;
      compose();
    });
  });

  addFilterRow();
  compose();
})();
