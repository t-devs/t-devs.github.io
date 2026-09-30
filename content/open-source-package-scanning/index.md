---
title: "Package Paranoia - Open Source Package Scanning"
authors: ["devs"]
date: 2026-09-22
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

A single scanner can trip over its own blind spots, though — the same behavioral shapes it's watching for can show up by coincidence in a completely legitimate package that just happens to bundle a minified copy of some unrelated library. So before anything actually gets published here, a second, independently-built scanner ([Socket](https://socket.dev)) has to agree. Socket looks at a different mix of signals than GuardDog does — code inspection, package and maintainer metadata, and a maintained, human-reviewed list of confirmed malware — and only packages both tools flag make it onto this page. It's been an interesting way to watch two differently-built tools agree, and just as often not.

This is a hobby project, not a security product — it won't catch everything, and it's one signal among many. But it's been a fun way to get a little visibility into a corner of the open source ecosystem that attackers have been targeting heavily the past year.

<p id="findings-status" class="findings-status">Loading findings&hellip;</p>

<div id="findings-chart"></div>

<p class="coverage-note">Not every package that gets published or updated actually gets a GuardDog scan — only what clears the triage filter above does. Here's roughly what share of real registry activity that filter covers, over the same window as the chart above. The npm figure counts every document revision the registry reports (deprecations and maintainer edits included, not just new versions), so it meaningfully overstates real publish volume — treat it as an upper bound on "seen," not an exact publish count.</p>

<div id="coverage-charts" class="coverage-charts">
  <div id="coverage-chart-npm" class="coverage-chart"></div>
  <div id="coverage-chart-pypi" class="coverage-chart"></div>
</div>

<div id="findings-list" class="findings-grid"></div>

{{< echarts "1px" "1px" >}}
{}
{{< /echarts >}}
