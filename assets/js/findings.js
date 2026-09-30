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

  function scoreLabel(finding) {
    // guarddog_score is null when GuardDog couldn't score the package at all
    // (e.g. the registry had already removed it by scan time) -- distinct
    // from a real low/zero score. Publishing no longer requires a GuardDog
    // score at all (Socket confirming alone is sufficient), so this case is
    // expected, not an error.
    return typeof finding.guarddog_score === "number" ? finding.guarddog_score.toFixed(1) : null;
  }

  function socketTags(finding) {
    return (finding.match_reasons || []).concat(finding.report_summary || []);
  }

  function appendSocketBadge(container, socket) {
    // Older digests (and any row written before the Socket gate) have no
    // "socket" field -- render nothing rather than a broken badge.
    if (!socket || socket.verdict !== "confirmed") return;
    var isLink = typeof socket.url === "string" && socket.url.indexOf("https://socket.dev/") === 0;
    var badge = el(isLink ? "a" : "span", "finding-card__socket", "Confirmed by Socket");
    if (isLink) {
      badge.href = socket.url;
      badge.target = "_blank";
      badge.rel = "noopener noreferrer";
    }
    if (socket.alert_types && socket.alert_types.length) {
      badge.title = "Socket alerts: " + socket.alert_types.join(", ");
    }
    container.appendChild(badge);
  }

  function appendAikidoBadge(container, finding) {
    // aikido_flagged is a plain bool, present on every row written after
    // guarddog-pipeline's Aikido fallback shipped -- older/legacy rows
    // (and anything Aikido's list doesn't have) are false, no badge.
    // Unlike Socket, Aikido gives us no deep link -- it's a static
    // blocklist match, not a per-package analysis page.
    if (!finding || !finding.aikido_flagged) return;
    var badge = el("span", "finding-card__aikido", "Flagged by Aikido");
    badge.title = "Exact name+version match on Aikido Security's public malware blocklist";
    container.appendChild(badge);
  }

  function appendTags(container, tags, small) {
    if (!tags.length) return;
    var tagWrap = el("div", small ? "finding-card__reasons finding-card__reasons--sm" : "finding-card__reasons");
    tags.forEach(function (tag) {
      tagWrap.appendChild(el("span", small ? "finding-tag finding-tag--sm" : "finding-tag", tag));
    });
    container.appendChild(tagWrap);
  }

  // A single version's own card -- unchanged shape from before grouping existed.
  function renderCard(finding) {
    var card = el("div", "finding-card");

    var header = el("div", "finding-card__header");
    header.appendChild(el("span", "finding-card__name", finding.name));
    header.appendChild(
      el("span", "finding-card__ecosystem", ECOSYSTEM_LABELS[finding.ecosystem] || finding.ecosystem)
    );
    card.appendChild(header);

    var score = scoreLabel(finding);
    if (score !== null) {
      card.appendChild(el("div", "finding-card__hits", "GuardDog score: " + score));
    } else {
      card.appendChild(el("div", "finding-card__hits finding-card__hits--unscannable", "GuardDog couldn't scan this package"));
    }

    card.appendChild(el("div", "finding-card__meta", "v" + finding.version + " · " + relativeTime(finding.scanned_at)));
    appendSocketBadge(card, finding.socket);
    appendAikidoBadge(card, finding);
    appendTags(card, socketTags(finding), false);

    return card;
  }

  // One row inside an expanded version group -- same telemetry as a full
  // card (score, detection time, match reasons, Socket alerts), just laid
  // out compactly since the header/ecosystem/badge are already shown once
  // at the group level.
  function renderVersionRow(finding) {
    var row = el("div", "finding-version-row");
    row.appendChild(el("span", "finding-version-row__version", "v" + finding.version));
    var score = scoreLabel(finding);
    row.appendChild(el(
      "span",
      "finding-version-row__score" + (score === null ? " finding-version-row__score--unscannable" : ""),
      score === null ? "unscannable" : score
    ));
    row.appendChild(el("span", "finding-version-row__meta", relativeTime(finding.scanned_at)));
    if (finding.socket && finding.socket.alert_types && finding.socket.alert_types.length) {
      row.title = "Socket alerts: " + finding.socket.alert_types.join(", ");
    }
    if (finding.aikido_flagged) {
      row.appendChild(el("span", "finding-tag finding-tag--sm finding-tag--aikido", "Aikido"));
    }
    appendTags(row, socketTags(finding), true);
    return row;
  }

  // versions: 2+ findings sharing an ecosystem+name, newest first (the order
  // they already arrive in from the digest). Keeps every version's own
  // telemetry (score, detection time, match reasons, Socket alerts) -- just
  // collapsed behind a disclosure instead of one full card per version,
  // which is what actually clogs the list for a package like prosocks with
  // 22 flagged versions.
  function renderVersionGroup(versions) {
    var newest = versions[0];
    var card = el("div", "finding-card finding-card--group");

    var header = el("div", "finding-card__header");
    header.appendChild(el("span", "finding-card__name", newest.name));
    header.appendChild(el("span", "finding-card__ecosystem", ECOSYSTEM_LABELS[newest.ecosystem] || newest.ecosystem));
    card.appendChild(header);

    var scores = versions
      .map(function (f) {
        return f.guarddog_score;
      })
      .filter(function (s) {
        return typeof s === "number";
      });
    if (scores.length) {
      var lo = Math.min.apply(null, scores).toFixed(1);
      var hi = Math.max.apply(null, scores).toFixed(1);
      card.appendChild(el("div", "finding-card__hits", "GuardDog score: " + (lo === hi ? lo : lo + "–" + hi)));
    } else {
      card.appendChild(el("div", "finding-card__hits finding-card__hits--unscannable", "GuardDog couldn't scan these"));
    }

    card.appendChild(el(
      "div",
      "finding-card__meta",
      versions.length + " versions flagged · most recent " + relativeTime(newest.scanned_at)
    ));
    appendSocketBadge(card, newest.socket);
    appendAikidoBadge(card, newest);

    var details = document.createElement("details");
    details.className = "finding-card__versions";
    var summary = document.createElement("summary");
    summary.textContent = "Show all " + versions.length + " versions";
    details.appendChild(summary);
    var list = el("div", "finding-card__version-list");
    versions.forEach(function (finding) {
      list.appendChild(renderVersionRow(finding));
    });
    details.appendChild(list);
    card.appendChild(details);

    return card;
  }

  // Groups by ecosystem+name, preserving first-seen (i.e. newest-first)
  // order so a package's position in the list still reflects its most
  // recent flagged version.
  function groupByPackage(findings) {
    var order = [];
    var groups = {};
    findings.forEach(function (finding) {
      var key = finding.ecosystem + "#" + finding.name;
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(finding);
    });
    return order.map(function (key) {
      return groups[key];
    });
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
    groupByPackage(findings).forEach(function (versions) {
      list.appendChild(versions.length > 1 ? renderVersionGroup(versions) : renderCard(versions[0]));
    });
  }

  // dailyScanCounts: same shape/window as dailyCounts, but total packages
  // scanned per ecosystem/day rather than just forwarded findings -- runs
  // one to two orders of magnitude higher, hence the separate log-scale
  // axis rather than sharing dailyCounts' linear one. Returns null for a
  // day with no scan data at all -- either an older digest predating this
  // series, or (log axes can't plot zero/negative) a genuine zero-scan day
  // -- so the line shows a gap there instead of a misleading point.
  function scanSeriesData(dates, dailyScanCounts, key) {
    var byDate = {};
    (dailyScanCounts || []).forEach(function (d) {
      byDate[d.date] = d;
    });
    return dates.map(function (date) {
      var row = byDate[date];
      var value = row && row[key];
      return typeof value === "number" && value > 0 ? value : null;
    });
  }

  // dailyCounts: [{date: "2026-09-22", npm: 2, pypi: 5}, ...], one entry
  // per day in the digest's window, oldest first, zero-filled -- see
  // publisher-render in guarddog-pipeline for how this is built server-side.
  //
  // Two stacked grids, not one shared plot area: an earlier version put the
  // findings bars (linear axis, small range e.g. 0-20) and scanned-volume
  // lines (log axis, 1-2000+) in the same plot, on separate y-axes. That's
  // visually dishonest -- a findings bar near its own small axis max gets
  // drawn nearly full-height, landing above where a much larger log-axis
  // value sits (confirmed live: 20 PyPI findings vs 653 PyPI scanned on the
  // same day rendered with the findings bar looking taller). A linear and a
  // log axis can't share one plot area and still be visually comparable, so
  // each series family gets its own panel instead.
  function chartOption(dailyCounts, dailyScanCounts) {
    var dates = dailyCounts.map(function (d) {
      return d.date;
    });
    var hasScanCounts = !!(dailyScanCounts && dailyScanCounts.length);

    var series = [
      {
        name: "npm",
        type: "bar",
        stack: "total",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: dailyCounts.map(function (d) {
          return d.npm;
        }),
      },
      {
        name: "PyPI",
        type: "bar",
        stack: "total",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: dailyCounts.map(function (d) {
          return d.pypi;
        }),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ];
    var legendData = ["npm", "PyPI"];

    if (hasScanCounts) {
      series.push(
        {
          name: "npm scanned",
          type: "line",
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 4,
          data: scanSeriesData(dates, dailyScanCounts, "npm"),
        },
        {
          name: "PyPI scanned",
          type: "line",
          xAxisIndex: 1,
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 4,
          data: scanSeriesData(dates, dailyScanCounts, "pypi"),
        }
      );
      legendData = legendData.concat(["npm scanned", "PyPI scanned"]);
    }

    if (!hasScanCounts) {
      // Fall back to the original single-panel layout when there's no scan
      // data at all (e.g. an older digest) -- no second axis to conflict with.
      return {
        title: { text: "Suspicious findings per day", textStyle: { fontSize: 14 } },
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { data: legendData, bottom: 0 },
        grid: { left: 45, right: 20, top: 40, bottom: 60 },
        xAxis: { type: "category", data: dates },
        yAxis: { type: "value", minInterval: 1 },
        series: series,
      };
    }

    return {
      title: [
        { text: "Suspicious findings per day", top: 0, left: "center", textStyle: { fontSize: 13 } },
        { text: "Packages scanned per day (log scale)", top: "54%", left: "center", textStyle: { fontSize: 13 } },
      ],
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { data: legendData, bottom: 0 },
      axisPointer: { link: [{ xAxisIndex: "all" }] },
      grid: [
        { left: 50, right: 20, top: 30, height: 130 },
        { left: 50, right: 20, top: 250, height: 130 },
      ],
      xAxis: [
        { type: "category", data: dates, gridIndex: 0, axisLabel: { show: false }, axisTick: { show: false } },
        { type: "category", data: dates, gridIndex: 1 },
      ],
      yAxis: [
        { type: "value", gridIndex: 0, minInterval: 1 },
        // echarts doesn't support stacking on a log axis anyway -- these
        // two lines are unstacked, unlike the findings bars above.
        { type: "log", gridIndex: 1, logBase: 10, min: 1, splitLine: { show: false } },
      ],
      series: series,
    };
  }

  var chartInstance = null;
  var lastDailyCounts = [];
  var lastDailyScanCounts = [];

  function renderChart(dailyCounts, dailyScanCounts) {
    var container = document.getElementById("findings-chart");
    if (!container || !window.echarts || !dailyCounts.length) return;
    if (chartInstance) chartInstance.dispose();
    chartInstance = window.echarts.init(container, window.isDark ? "dark" : "macarons");
    chartInstance.setOption(chartOption(dailyCounts, dailyScanCounts));
  }

  // The theme's own dark/light toggle broadcasts through these globals
  // (see themes/DoIt/assets/js/lib/echarts.js for the same pattern) --
  // hook into them so our chart re-themes and resizes along with the rest
  // of the page, instead of only the theme's own .echarts-class charts.
  if (window.switchThemeEventSet) {
    window.switchThemeEventSet.add(function () {
      if (lastDailyCounts.length) renderChart(lastDailyCounts, lastDailyScanCounts);
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
        lastDailyScanCounts = digest.daily_scan_counts || [];
        renderList(findings);
        renderChart(lastDailyCounts, lastDailyScanCounts);
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
