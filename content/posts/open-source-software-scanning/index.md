---
title: "Open Source Software Scanning"
authors: ["devs"]
date: 2026-09-22
categories: ["projects"]
library:
  js:
    findings:
      src: "js/findings.js"
      defer: true
  css:
    findings: "css/findings.css"
---

A live feed of suspicious open-source packages caught by an automated scanner.

<p id="findings-status" class="findings-status">Loading findings&hellip;</p>

<div id="findings-chart"></div>

<div id="findings-list" class="findings-grid"></div>

{{< echarts "1px" "1px" >}}
{}
{{< /echarts >}}
