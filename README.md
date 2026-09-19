# CatRun public site

Static official, support, and privacy pages for the live App Store game.

## Open locally

From this folder:

```bash
python3 -m http.server 4173
```

Then visit:

- http://127.0.0.1:4173/
- http://127.0.0.1:4173/support/
- http://127.0.0.1:4173/privacy/
- http://127.0.0.1:4173/llms.txt

Language is chosen from `?lang=`, then the last saved choice, then the browser language. Thirteen launch locales are available.

Long-form coverage:

- Simplified Chinese, Traditional Chinese, English, and Japanese cover official and support long-form. Traditional is converted from the Simplified source.
- Other locales use App Store titles from `marketing.json` and fall back to English long-form.
- Privacy policy body exists only in Simplified Chinese and English. The switcher says so.

## Live listing

Do not write “not listed yet.” The game is on the App Store:

- Names: `CatRun: Neon Market Rush` / `CatRun：晨市冲刺`
- Apple ID: `6793595842`
- Universal URL: `https://apps.apple.com/app/id6793595842`
- Seller: `Shanghai Qishan Cultural Communication Co., Ltd.`
- Version: `1.0.1` (build 2), free, 4+, iOS 17+
- Privacy answers: Data Not Collected

Facts live in `assets/site-facts.json`. After changing `Tools/marketing_constants.py`, run:

```bash
python3 Tools/write_site_facts.py
python3 Tools/patch_site_copy.py
```

`write_site_facts.py` also patches the `urls` and `app` blocks in both marketing JSON files. Full store-copy regeneration is still `python3 Tools/build_marketing.py`.

## Public URLs used by the app and App Store Connect

Keep these paths when you publish:

- `https://weizhichao1027-collab.github.io/catrun-support/`
- `https://weizhichao1027-collab.github.io/catrun-support/support`
- `https://weizhichao1027-collab.github.io/catrun-support/privacy`
- `https://weizhichao1027-collab.github.io/catrun-support/llms.txt`

Upload the contents of this `docs/` folder to the host root so those paths resolve.

## Copy sources

- `assets/site-facts.json` is the live listing record.
- `assets/marketing.json` is generated from `AppStore/copy/marketing.json` by `Tools/build_marketing.py`.
- `assets/site-copy.json` holds the extra official and support writing.

## SEO / GEO

- JSON-LD (`MobileApplication`, `WebSite`, `FAQPage`, breadcrumbs) is in the HTML and refreshed by `assets/site.js`.
- `llms.txt` is the citation file for assistants.
- `robots.txt` allows major search and AI crawlers.
- `sitemap.xml` lists the three pages plus `llms.txt`.
- Smart App Banner uses `app-id=6793595842`.
