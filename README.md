# DIY Website Cost Calculator

Static single-page tool site. No backend, no database, no accounts, no data
collection. All calculations happen in the visitor's browser.

## Files

- `index.html` — page structure, explainer (~843 words) + FAQ (5 items), footer
- `css/styles.css` — original design, responsive
- `js/pricing.js` — pure pricing logic (Node-testable, integer cents)
- `js/app.js` — UI wiring; `AFFILIATE_LINKS` config at the top
- `test/` — `test-pricing.js` (Node), `smoke-dom.js` (Node, fake DOM),
  `check-html.py` (tag balance, anchors, allowed URLs, required strings)

## Prices (checked Oct–Nov 2026)

- .com domain: $13.98 first year / ~$15 renewal
- Namecheap Stellar shared hosting: $26.88 first year / $55.88 renewal
- SSL: $0 (Let's Encrypt)
- Business email: ~$12/year
- Paid theme: $50–$200 one-time
- Backup plugin (UpdraftPlus Premium): ~$70/year (free tier exists)
- Website builder path: $190–$350/year
- Freelancer: $500–$5,000 by site type; agency $3,000+

## Deploy

Drop the whole folder into any static host (Cloudflare Pages, GitHub Pages,
Netlify Drop). Relative paths only — no domain hardcoded. Entry point:
`index.html`.

## Tests

```sh
node test/test-pricing.js   # 1405 checks, 4 types x 3 methods x 8 extras combos
node test/smoke-dom.js      # runs app.js against a fake DOM built from index.html
python3 test/check-html.py  # tag balance, anchor targets, allowed URLs, word count
```

## Still TODO (do not ship as final)

- Per-page deep links: all three buy buttons currently use the one approved
  Namecheap tracking link (lands on the domain-registration page; the 30-day
  Impact cookie still attributes later purchases). Generate proper
  hosting/email deep links in Impact (Create a Link -> Enter a Landing Page)
  and point each button at its own link.
- No domain yet (zero-cost rule). Free subdomain hosting works technically,
  but AdSense approval on a free subdomain is unlikely — domain is the only
  paid step, pending user approval.
- Preset prices were not tested against a live merchant checkout; the footer
  and every table tell visitors to verify on the merchant's page before buying.
