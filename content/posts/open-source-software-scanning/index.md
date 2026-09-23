---
title: "Package Paranoia - Open Source Package Scanning"
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

Supply-chain attacks on open-source packages aren't hypothetical anymore. Every few weeks there's another story about a malicious package sneaking onto PyPI or npm — sometimes hiding behind a name that looks *just* close enough to something popular, sometimes just brand new and hoping nobody looks too closely before enough people install it.

I got curious how hard it would be to keep an eye on that myself, so I put together a small automated pipeline that watches both registries for newly published or updated packages around the clock. Most of what shows up isn't worth a second look, so before anything gets a deeper scan, it has to clear a quick filter: is this package unusually popular, does its name look like it's impersonating something well-known, or is it brand new with basically no track record? Those are the shapes that most real incidents actually take.

Anything that clears that bar gets run through an open-source malware scanner ([GuardDog](https://github.com/DataDog/guarddog), built by Datadog) that looks for the kind of behavior that shows up in genuinely malicious packages — things like destructive file operations, code that spawns processes it has no business spawning, or code that goes out of its way to obscure what it's actually doing.

The findings feed below is intentionally narrow. Almost any real package reads a file or makes a network call, so a scanner counting that alone would flag nearly everything and be useless. What you're seeing here has cleared a much higher bar — packages that tripped an actual behavioral red flag, not just "this package exists and does normal package things."

This is a hobby project, not a security product — it won't catch everything, and it's one signal among many. But it's been a fun way to get a little visibility into a corner of the open source ecosystem that attackers have been targeting heavily the past year.

<p id="findings-status" class="findings-status">Loading findings&hellip;</p>

<div id="findings-chart"></div>

<div id="findings-list" class="findings-grid"></div>

{{< echarts "1px" "1px" >}}
{}
{{< /echarts >}}
