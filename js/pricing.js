// pricing.js — pure pricing logic for the DIY Website Cost Calculator.
// No DOM access here, so this file can be unit-tested with Node.
// All money is handled in integer cents to avoid floating-point errors.

'use strict';

var PRICES = {
  // cents
  domainFirstYear: 1398,    // .com, $13.98 — Namecheap regular price
  domainRenewal: 1500,      // ~$15/year
  hostingFirstYear: 2688,   // Namecheap Stellar, $26.88
  hostingRenewal: 5588,     // Namecheap Stellar, $55.88
  ssl: 0,                   // Let's Encrypt, free
  emailPerYear: 1200,       // ~$12/year (Namecheap Private Email)
  themeOneTimeMin: 5000,    // paid theme, $50–$200 one-time
  themeOneTimeMax: 20000,
  backupPerYear: 7000,      // UpdraftPlus Premium, ~$70/year (free tier exists)
  builderPerYearMin: 19000, // Wix/Squarespace-like builder, $190–$350/year
  builderPerYearMax: 35000
};

var SITE_TYPES = {
  blog: {
    label: 'Personal Blog',
    defaults: { email: false, theme: false, backup: false },
    freelancerMin: 50000,   // $500
    freelancerMax: 150000   // $1,500
  },
  business: {
    label: 'Small Business Website (5 pages)',
    defaults: { email: true, theme: false, backup: false },
    freelancerMin: 100000,  // $1,000
    freelancerMax: 300000   // $3,000
  },
  store: {
    label: 'Online Store',
    defaults: { email: true, theme: true, backup: true },
    freelancerMin: 200000,  // $2,000
    freelancerMax: 500000   // $5,000
  },
  portfolio: {
    label: 'Portfolio',
    defaults: { email: false, theme: true, backup: false },
    freelancerMin: 50000,   // $500
    freelancerMax: 200000   // $2,000
  }
};

var AGENCY_MIN = 300000; // $3,000+

var METHODS = ['diy', 'builder', 'freelancer'];

function range(min, max) {
  return { min: min, max: max };
}

function addRange(a, b) {
  return { min: a.min + b.min, max: a.max + b.max };
}

// DIY Year 1 total for a given extras set, computed directly from prices
// (kept separate so compute() never has to call itself).
function diyYear1Total(extras) {
  var total = range(
    PRICES.domainFirstYear + PRICES.hostingFirstYear,
    PRICES.domainFirstYear + PRICES.hostingFirstYear
  );
  if (extras.email) total = addRange(total, range(PRICES.emailPerYear, PRICES.emailPerYear));
  if (extras.theme) total = addRange(total, range(PRICES.themeOneTimeMin, PRICES.themeOneTimeMax));
  if (extras.backup) total = addRange(total, range(PRICES.backupPerYear, PRICES.backupPerYear));
  return total;
}

// Compute all three tables for a given selection.
// selection: { type: 'blog'|'business'|'store'|'portfolio',
//              method: 'diy'|'builder'|'freelancer',
//              extras: { email: bool, theme: bool, backup: bool } }
// Extras only apply to the DIY method; builder/freelancer ignore them.
// Returns { year1: { rows, total }, year2: { rows, total, diff },
//           comparison: { freelancer, agencyMin, diyYear1 } }
// Each row: { name, detail, price: {min,max} (cents), note, linkKey or null }
// total: {min,max} in cents. diff: {min,max} = year2.total - year1.total (cents).
function compute(selection) {
  var type = SITE_TYPES[selection.type] || SITE_TYPES.blog;
  var method = METHODS.indexOf(selection.method) >= 0 ? selection.method : 'diy';
  var extras = selection.extras || { email: false, theme: false, backup: false };

  var year1Rows = [];
  var year2Rows = [];
  var year1Total = range(0, 0);
  var year2Total = range(0, 0);

  function pushYear1(row) {
    year1Rows.push(row);
    year1Total = addRange(year1Total, row.price);
  }
  function pushYear2(row) {
    year2Rows.push(row);
    year2Total = addRange(year2Total, row.price);
  }

  if (method === 'diy') {
    pushYear1({
      name: 'Domain name (.com)',
      detail: 'First year',
      price: range(PRICES.domainFirstYear, PRICES.domainFirstYear),
      note: 'First-year price; renewals are higher. Check the merchant\u2019s page before buying.',
      linkKey: 'domain'
    });
    pushYear1({
      name: 'Shared hosting (Stellar plan)',
      detail: 'First year',
      price: range(PRICES.hostingFirstYear, PRICES.hostingFirstYear),
      note: 'Introductory first-year price. Check the merchant\u2019s page before buying.',
      linkKey: 'hosting'
    });
    pushYear1({
      name: 'SSL certificate',
      detail: 'Included with hosting',
      price: range(0, 0),
      note: 'Free via Let\u2019s Encrypt — most hosts install it automatically.',
      linkKey: null
    });
    if (extras.email) {
      pushYear1({
        name: 'Business email',
        detail: '1 mailbox, per year',
        price: range(PRICES.emailPerYear, PRICES.emailPerYear),
        note: 'About $12/year. Check the merchant\u2019s page before buying.',
        linkKey: 'email'
      });
    }
    if (extras.theme) {
      pushYear1({
        name: 'Paid theme',
        detail: 'One-time purchase',
        price: range(PRICES.themeOneTimeMin, PRICES.themeOneTimeMax),
        note: '$50–$200 one-time, depending on the theme. No renewal fee.',
        linkKey: null
      });
    }
    if (extras.backup) {
      pushYear1({
        name: 'Backup plugin (Premium)',
        detail: 'Per year',
        price: range(PRICES.backupPerYear, PRICES.backupPerYear),
        note: 'About $70/year. A free version covers basic scheduled backups.',
        linkKey: null
      });
    }

    pushYear2({
      name: 'Domain name (.com)',
      detail: 'Renewal, per year',
      price: range(PRICES.domainRenewal, PRICES.domainRenewal),
      note: 'About $15/year at renewal.',
      linkKey: null
    });
    pushYear2({
      name: 'Shared hosting (Stellar plan)',
      detail: 'Renewal, per year',
      price: range(PRICES.hostingRenewal, PRICES.hostingRenewal),
      note: 'Renews at the regular rate — about double the first year.',
      linkKey: null
    });
    pushYear2({
      name: 'SSL certificate',
      detail: 'Renewal',
      price: range(0, 0),
      note: 'Still free at renewal.',
      linkKey: null
    });
    if (extras.email) {
      pushYear2({
        name: 'Business email',
        detail: 'Per year',
        price: range(PRICES.emailPerYear, PRICES.emailPerYear),
        note: 'About $12/year.',
        linkKey: null
      });
    }
    if (extras.theme) {
      pushYear2({
        name: 'Paid theme',
        detail: 'Renewal',
        price: range(0, 0),
        note: 'One-time purchase — nothing to pay in Year 2.',
        linkKey: null
      });
    }
    if (extras.backup) {
      pushYear2({
        name: 'Backup plugin (Premium)',
        detail: 'Per year',
        price: range(PRICES.backupPerYear, PRICES.backupPerYear),
        note: 'About $70/year.',
        linkKey: null
      });
    }
  } else if (method === 'builder') {
    pushYear1({
      name: 'Website builder plan',
      detail: 'Per year (hosting included)',
      price: range(PRICES.builderPerYearMin, PRICES.builderPerYearMax),
      note: '$190–$350/year depending on the plan. Buy directly from the provider.',
      linkKey: null
    });
    pushYear1({
      name: 'Domain name (.com)',
      detail: 'First year',
      price: range(0, 0),
      note: 'Included free for the first year on annual plans.',
      linkKey: null
    });
    pushYear1({
      name: 'SSL certificate',
      detail: 'Included',
      price: range(0, 0),
      note: 'Included with the plan.',
      linkKey: null
    });

    pushYear2({
      name: 'Website builder plan',
      detail: 'Per year (hosting included)',
      price: range(PRICES.builderPerYearMin, PRICES.builderPerYearMax),
      note: 'Renews at the same plan price.',
      linkKey: null
    });
    pushYear2({
      name: 'Domain name (.com)',
      detail: 'Renewal',
      price: range(0, 0),
      note: 'Stays included while you keep the plan.',
      linkKey: null
    });
    pushYear2({
      name: 'SSL certificate',
      detail: 'Renewal',
      price: range(0, 0),
      note: 'Still included.',
      linkKey: null
    });
  } else { // freelancer
    pushYear1({
      name: 'Freelancer fee',
      detail: 'One-time project cost',
      price: range(type.freelancerMin, type.freelancerMax),
      note: 'Varies by site type and freelancer. No link — get quotes and compare.',
      linkKey: null
    });
    pushYear1({
      name: 'Domain name (.com)',
      detail: 'First year',
      price: range(PRICES.domainFirstYear, PRICES.domainFirstYear),
      note: 'You still pay for the domain yourself. Check the merchant\u2019s page before buying.',
      linkKey: 'domain'
    });
    pushYear1({
      name: 'Shared hosting (Stellar plan)',
      detail: 'First year',
      price: range(PRICES.hostingFirstYear, PRICES.hostingFirstYear),
      note: 'You still pay for hosting yourself. Check the merchant\u2019s page before buying.',
      linkKey: 'hosting'
    });
    pushYear1({
      name: 'SSL certificate',
      detail: 'Included with hosting',
      price: range(0, 0),
      note: 'Free via Let\u2019s Encrypt.',
      linkKey: null
    });

    pushYear2({
      name: 'Domain name (.com)',
      detail: 'Renewal, per year',
      price: range(PRICES.domainRenewal, PRICES.domainRenewal),
      note: 'About $15/year at renewal.',
      linkKey: null
    });
    pushYear2({
      name: 'Shared hosting (Stellar plan)',
      detail: 'Renewal, per year',
      price: range(PRICES.hostingRenewal, PRICES.hostingRenewal),
      note: 'Renews at the regular rate.',
      linkKey: null
    });
    pushYear2({
      name: 'SSL certificate',
      detail: 'Renewal',
      price: range(0, 0),
      note: 'Still free at renewal.',
      linkKey: null
    });
  }

  // Comparison table: hiring someone instead (always shown, depends on site type).
  var comparison = {
    freelancer: range(type.freelancerMin, type.freelancerMax),
    agencyMin: AGENCY_MIN,
    diyYear1: diyYear1Total(type.defaults)
  };

  var diff = {
    min: year2Total.min - year1Total.max,
    max: year2Total.max - year1Total.min
  };
  if (method === 'builder') {
    // The builder plan renews at the same price as Year 1 — it is the same
    // plan, not an independent draw from the range, so the difference is 0.
    diff = range(0, 0);
  }

  return {
    year1: { rows: year1Rows, total: year1Total },
    year2: { rows: year2Rows, total: year2Total, diff: diff },
    comparison: comparison
  };
}

function formatCents(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatRange(r) {
  if (r.min === r.max) return formatCents(r.min);
  return formatCents(r.min) + ' \u2013 ' + formatCents(r.max);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRICES: PRICES,
    SITE_TYPES: SITE_TYPES,
    AGENCY_MIN: AGENCY_MIN,
    METHODS: METHODS,
    compute: compute,
    formatCents: formatCents,
    formatRange: formatRange
  };
}
