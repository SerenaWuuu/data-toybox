# TESTING.md — Data Toybox verification log

## Automated checks (done, all passing)

- **JS syntax**: `node --check` passes on all four files
  (`js/app.js`, `js/csv-playground.js`, `js/sql-shine.js`, `js/nl-sql.js`).
- **CDN availability** (HTTP 200 confirmed via curl):
  - `https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js`
  - `https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js`
  - `https://cdn.jsdelivr.net/npm/sql-formatter@15.9.0/dist/sql-formatter.min.js`
  - Note: `sql-formatter@15.3.3/dist/sql-formatter.min.js` 404s (bad version pin),
    switched to pinned `15.9.0` which 404-checks clean and exposes the `sqlFormatter` global.
- **sql-formatter functional test** (bundle executed in node via its UMD wrapper):
  - `format("select a,b from t where x>1 order by 1", {dialect:"bigquery"})` produces
    correctly formatted BigQuery SQL.
  - `format("SELECT TOP 10 a FROM t", {dialect:"tsql"})` produces correctly formatted T-SQL.
  - `supportedDialects` includes `bigquery`, `tsql`, `postgresql`, `mysql`, `sql`
    (all five offered in the dialect switcher).
- **Copy audit**: no em-dashes anywhere in user-facing copy (grep verified).
  Copy reviewed for human tone and for loading/empty/error states on every tool.

## Logic walkthrough (code-reviewed, not browser-executed)

- **CSV Playground**: PapaParse with `header:true, skipEmptyLines:true, dynamicTyping:true`;
  fatal parse states (empty file, bad quoting, wrong extension) each map to a
  friendly error card. Column types detected by sampling (number/date/text).
  Chart suggestion heuristic: date+number → line, 2+ numbers → scatter,
  category+number → pie (≤8 categories) else bar. Bar/pie aggregate by category
  (top-N with "Other" bucket); scatter coerces both axes to numbers and skips
  non-numeric rows; PNG export via `chart.getDataURL`.
- **SQL Shine**: format wrapped in try/catch; empty input and CDN-load failure
  both show friendly errors; Ctrl/Cmd+Enter formats; char/line/word counter
  updates live; clipboard uses `navigator.clipboard` with `execCommand` fallback.
- **NL to SQL**: identifiers sanitized (bare or backtick-quoted), string literals
  quoted with `''` escaping, numbers/TRUE/FALSE/NULL passed through;
  operators include `=, !=, >, <, >=, <=, LIKE, IN, IS NULL, IS NOT NULL`;
  aggregation auto-adds `GROUP BY` over plain columns when none is given;
  output recomposes live on every input event.

## Still needs on-device testing (GitHub Pages, iPhone Safari)

- Drag-drop and file picker on iOS Safari; sample-data button as fallback path.
- ECharts touch rendering and PNG download on mobile Safari.
- Clipboard behavior on iOS (secure context on `*.github.io` is HTTPS, so
  `navigator.clipboard` should work; fallback path untested on device).
- Sticky tab bar behavior on small screens.
- Camera is not used by this project; no permissions testing needed.
