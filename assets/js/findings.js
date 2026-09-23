(function () {
  "use strict";

  // guarddog-pipeline's PROD public_report_url output (state key
  // prod/terraform.tfstate, project_name guarddog-pipeline-prod). dev has
  // its own separate CloudFront distribution; this site must only ever
  // point at prod's.
  var FINDINGS_URL = "https://dcekmrfb4j8i7.cloudfront.net/findings.json";

  var ECOSYSTEM_LABELS = { pypi: "PyPI", npm: "npm" };

  function relativeTime(unixSeconds) {
    var deltaSec = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
    var steps = [60, 60, 24, 30, 12];
    var names = ["second", "minute", "hour", "day", "month"];
    var value = deltaSec;
    var label = "second";
    for (var i = 0; i < steps.length; i++) {
      if (value < steps[i]) {
        label = names[i];
        break;
      }
      value = Math.floor(value / steps[i]);
      label = names[i];
    }
    return value + " " + label + (value === 1 ? "" : "s") + " ago";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCard(finding) {
    var card = el("div", "finding-card");

    var header = el("div", "finding-card__header");
    header.appendChild(el("span", "finding-card__name", finding.name));
    header.appendChild(
      el("span", "finding-card__ecosystem", ECOSYSTEM_LABELS[finding.ecosystem] || finding.ecosystem)
    );
    card.appendChild(header);

    var hitLabel = finding.hit_count + " GuardDog issue" + (finding.hit_count === 1 ? "" : "s");
    card.appendChild(el("div", "finding-card__hits", hitLabel));

    var metaLabel = "v" + finding.version + " · " + relativeTime(finding.scanned_at);
    card.appendChild(el("div", "finding-card__meta", metaLabel));

    var tags = (finding.match_reasons || []).concat(finding.report_summary || []);
    if (tags.length) {
      var tagWrap = el("div", "finding-card__reasons");
      tags.forEach(function (tag) {
        tagWrap.appendChild(el("span", "finding-tag", tag));
      });
      card.appendChild(tagWrap);
    }

    return card;
  }

  function renderList(findings) {
    var list = document.getElementById("findings-list");
    var status = document.getElementById("findings-status");
    if (!list) return;
    list.innerHTML = "";
    if (!findings.length) {
      if (status) status.textContent = "No suspicious findings yet.";
      return;
    }
    if (status) status.textContent = findings.length + " most recent suspicious findings.";
    findings.forEach(function (finding) {
      list.appendChild(renderCard(finding));
    });
  }

  // dailyCounts: [{date: "2026-09-22", npm: 2, pypi: 5}, ...], one entry
  // per day in the digest's window, oldest first, zero-filled -- see
  // publisher-render in guarddog-pipeline for how this is built server-side.
  function chartOption(dailyCounts) {
    var dates = dailyCounts.map(function (d) {
      return d.date;
    });
    return {
      title: { text: "Suspicious findings per day", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { data: ["npm", "PyPI"], bottom: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 50 },
      xAxis: { type: "category", data: dates },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "npm",
          type: "bar",
          stack: "total",
          data: dailyCounts.map(function (d) {
            return d.npm;
          }),
        },
        {
          name: "PyPI",
          type: "bar",
          stack: "total",
          data: dailyCounts.map(function (d) {
            return d.pypi;
          }),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }

  var chartInstance = null;
  var lastDailyCounts = [];

  function renderChart(dailyCounts) {
    var container = document.getElementById("findings-chart");
    if (!container || !window.echarts || !dailyCounts.length) return;
    if (chartInstance) chartInstance.dispose();
    chartInstance = window.echarts.init(container, window.isDark ? "dark" : "macarons");
    chartInstance.setOption(chartOption(dailyCounts));
  }

  // The theme's own dark/light toggle broadcasts through these globals
  // (see themes/DoIt/assets/js/lib/echarts.js for the same pattern) --
  // hook into them so our chart re-themes and resizes along with the rest
  // of the page, instead of only the theme's own .echarts-class charts.
  if (window.switchThemeEventSet) {
    window.switchThemeEventSet.add(function () {
      if (lastDailyCounts.length) renderChart(lastDailyCounts);
    });
  }
  if (window.resizeEventSet) {
    window.resizeEventSet.add(function () {
      if (chartInstance) chartInstance.resize();
    });
  }

  function init() {
    var status = document.getElementById("findings-status");
    fetch(FINDINGS_URL)
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.json();
      })
      .then(function (digest) {
        var findings = digest.findings || [];
        lastDailyCounts = digest.daily_counts || [];
        renderList(findings);
        renderChart(lastDailyCounts);
      })
      .catch(function (err) {
        if (status) status.textContent = "Couldn't load findings right now (" + err.message + ").";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
