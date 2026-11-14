// app.js — UI wiring for the DIY Website Cost Calculator.
// Pricing math lives in pricing.js; this file only reads state and renders.

// Namecheap affiliate programme approved via Impact 2026-11-13 (account 8196726).
// All three buttons use the approved tracking link; it lands on Namecheap's
// domain-registration page and the 30-day Impact cookie attributes any
// Namecheap purchase made after the click. Per-page deep links (hosting/email
// landing pages) still need generating in Impact: Create a Link -> Enter a
// Landing Page. Until then, do not hand-build deep-link URLs.
var NAMECHEAP_AFFILIATE_LINK = 'https://namecheap.pxf.io/c/8196726/1632743/5618';
var AFFILIATE_LINKS = {
  domain: NAMECHEAP_AFFILIATE_LINK,
  hosting: NAMECHEAP_AFFILIATE_LINK,
  email: NAMECHEAP_AFFILIATE_LINK
};

(function () {
  'use strict';

  var state = {
    type: 'business',
    method: 'diy',
    extras: { email: true, theme: false, backup: false }
  };

  var TYPE_LABELS = {
    blog: 'Personal Blog',
    business: 'Small Business Website (5 pages)',
    store: 'Online Store',
    portfolio: 'Portfolio'
  };

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function money(cents) {
    return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function rangeText(r) {
    if (r.min === r.max) return money(r.min);
    return money(r.min) + ' \u2013 ' + money(r.max);
  }

  function diffText(diff) {
    // diff: {min, max} in cents, = year2 total - year1 total.
    if (diff.min === 0 && diff.max === 0) {
      return 'Same as Year 1 — no renewal jump.';
    }
    if (diff.max <= 0) {
      // Year 2 is cheaper (e.g. a one-time theme made Year 1 higher).
      if (diff.min === diff.max) return 'Year 2 is ' + money(-diff.min) + ' less than Year 1.';
      return 'Year 2 is ' + money(-diff.max) + ' to ' + money(-diff.min) + ' less than Year 1.';
    }
    if (diff.min >= 0) {
      if (diff.min === diff.max) return 'Year 2 is ' + money(diff.min) + ' more than Year 1.';
      return 'Year 2 is ' + money(diff.min) + ' to ' + money(diff.max) + ' more than Year 1.';
    }
    return 'Year 2 is between ' + money(-diff.min) + ' less and ' + money(diff.max) + ' more than Year 1.';
  }

  function buyButton(linkKey) {
    if (!linkKey || !AFFILIATE_LINKS[linkKey]) return '';
    return '<a class="buy-btn" href="' + AFFILIATE_LINKS[linkKey] +
      '" target="_blank" rel="sponsored noopener">Get it on Namecheap</a>';
  }

  function rowHtml(row) {
    return '<tr>' +
      '<td><strong>' + row.name + '</strong><span class="row-detail">' + row.detail + '</span>' +
      (row.note ? '<span class="row-note">' + row.note + '</span>' : '') + '</td>' +
      '<td class="price">' + rangeText(row.price) + '</td>' +
      '<td class="buy">' + buyButton(row.linkKey) + '</td>' +
      '</tr>';
  }

  function tableHtml(title, table, showDiff) {
    var html = '<h3>' + title + '</h3>' +
      '<table><thead><tr><th>Item</th><th>Price</th><th></th></tr></thead><tbody>';
    table.rows.forEach(function (row) { html += rowHtml(row); });
    html += '</tbody><tfoot><tr><td><strong>Total</strong></td>' +
      '<td class="price"><strong>' + rangeText(table.total) + '</strong></td><td></td></tr></tfoot></table>';
    if (showDiff) {
      html += '<p class="diff-line">' + diffText(table.diff) + '</p>';
    }
    html += '<p class="price-note">Prices checked November 2026 — check the merchant\u2019s page before buying.</p>';
    return html;
  }

  function render() {
    var result = compute(state);

    // Step 3 (extras) only applies to the DIY path.
    var step3 = $('#step-extras');
    step3.style.display = state.method === 'diy' ? '' : 'none';

    // Sync card selection states.
    $all('[data-type]').forEach(function (el) {
      el.classList.toggle('selected', el.getAttribute('data-type') === state.type);
      el.setAttribute('aria-pressed', el.getAttribute('data-type') === state.type ? 'true' : 'false');
    });
    $all('[data-method]').forEach(function (el) {
      el.classList.toggle('selected', el.getAttribute('data-method') === state.method);
      el.setAttribute('aria-pressed', el.getAttribute('data-method') === state.method ? 'true' : 'false');
    });
    $all('[data-extra]').forEach(function (el) {
      el.checked = !!state.extras[el.getAttribute('data-extra')];
    });

    // Summary line.
    var methodLabel = state.method === 'diy'
      ? 'Do it yourself (self-hosted WordPress)'
      : state.method === 'builder'
        ? 'Website builder (Wix / Squarespace-like)'
        : 'Hire a freelancer';
    $('#summary-line').textContent =
      TYPE_LABELS[state.type] + ' · ' + methodLabel + ' — Year 1: ' +
      rangeText(result.year1.total) + ' · Year 2: ' + rangeText(result.year2.total) + ' per year.';

    // Table 1 — Year 1.
    $('#table-year1').innerHTML = tableHtml(
      state.method === 'diy' ? 'Year 1 — what you need to buy'
        : state.method === 'builder' ? 'Year 1 — what the builder plan covers'
        : 'Year 1 — freelancer fee plus the basics',
      result.year1, false);

    // Table 2 — Year 2 renewal.
    $('#table-year2').innerHTML = tableHtml('Year 2 — what renews', result.year2, true);

    // Table 3 — hiring comparison.
    var c = result.comparison;
    var compHtml = '<h3>Hiring someone instead</h3>' +
      '<table><thead><tr><th>Option</th><th>Price</th><th></th></tr></thead><tbody>' +
      '<tr><td><strong>Freelancer</strong><span class="row-detail">One-time project cost for a ' +
      TYPE_LABELS[state.type].toLowerCase() +
      '</span><span class="row-note">Get several quotes — prices vary a lot for the same brief.</span></td>' +
      '<td class="price">' + rangeText(c.freelancer) + '</td><td></td></tr>' +
      '<tr><td><strong>Agency</strong><span class="row-detail">One-time project cost</span>' +
      '<span class="row-note">Agencies usually start higher and include design, copy, and setup.</span></td>' +
      '<td class="price">' + money(c.agencyMin) + '+</td><td></td></tr>' +
      '</tbody></table>' +
      '<p class="diff-line">For comparison, doing it yourself costs ' +
      rangeText(c.diyYear1) + ' in Year 1.</p>' +
      '<p class="price-note">Prices checked November 2026 — check the merchant\u2019s page before buying.</p>';
    $('#table-compare').innerHTML = compHtml;
  }

  function applyTypeDefaults(type) {
    // Each site type comes with a sensible default setup; the user can change it.
    var defaults = {
      blog: { email: false, theme: false, backup: false },
      business: { email: true, theme: false, backup: false },
      store: { email: true, theme: true, backup: true },
      portfolio: { email: false, theme: true, backup: false }
    }[type] || { email: false, theme: false, backup: false };
    state.extras = { email: defaults.email, theme: defaults.theme, backup: defaults.backup };
  }

  function init() {
    $all('[data-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.type = el.getAttribute('data-type');
        applyTypeDefaults(state.type);
        render();
      });
    });
    $all('[data-method]').forEach(function (el) {
      el.addEventListener('click', function () {
        state.method = el.getAttribute('data-method');
        render();
      });
    });
    $all('[data-extra]').forEach(function (el) {
      el.addEventListener('change', function () {
        state.extras[el.getAttribute('data-extra')] = el.checked;
        render();
      });
    });
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
