---
title: "Security Findings"
date: 2026-09-22
authors: ["devs"]
description: "Live feed of suspicious open-source packages caught by an automated PyPI/npm scanning pipeline."
library:
  js:
    findings:
      src: "js/findings.js"
      defer: true
  css:
    findings: "css/findings.css"
---

I run a small serverless pipeline ([guarddog-pipeline](https://github.com/t-devs/guarddog-pipeline))
that watches PyPI and npm for newly published packages, triages them against
popularity/typosquat/freshness signals, and scans the interesting ones with
[GuardDog](https://github.com/DataDog/guarddog). Anything that crosses a
suspicion threshold shows up below.

This data is fetched live from a small public API on every page load, so
it's always current as of the last scan cycle -- no need to refresh the site
itself.

<p id="findings-status" class="findings-status">Loading findings&hellip;</p>

<div id="findings-chart"></div>

<div id="findings-list" class="findings-grid"></div>

{{< echarts "1px" "1px" >}}
{}
{{< /echarts >}}
