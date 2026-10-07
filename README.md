# 🧸 Data Toybox

Three tiny tools for people who live in spreadsheets and queries. Static site, no build step, no backend. Your data never leaves the page.

**The toys:**
- 📊 **CSV Playground**: drop in a CSV, get a data preview plus instant bar, line, pie, and scatter charts (ECharts), with PNG export.
- ✨ **SQL Shine**: paste a messy query, get it beautifully formatted. BigQuery, T-SQL, Postgres, MySQL, and Standard SQL dialects.
- 🗣️ **NL to SQL**: fill in table, columns, filters, and aggregations like a form, watch a valid SELECT statement assemble itself live.

## Preview locally

Any static server works:

```bash
cd data-toybox
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages

1. Push this folder to the `main` branch of your repo (e.g. `SerenaWuuu/data-toybox`).
2. On GitHub, open the repo → **Settings** → **Pages**.
3. Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main**, folder to **/(root)**. Save.
4. Your site goes live at `https://<username>.github.io/data-toybox/` within a minute or two.

No build, no actions, no config. Just files.

## Tech

- [PapaParse](https://www.papaparse.com/) for CSV parsing
- [Apache ECharts](https://echarts.apache.org/) for charts
- [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) for SQL beautifying
- Vanilla JS, zero frameworks, mobile first

## License

MIT. Grab it, fork it, make it yours. See [LICENSE](LICENSE).
