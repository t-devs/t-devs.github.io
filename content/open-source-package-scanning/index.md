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

Supply-chain attacks on open-source packages are not hypothetical anymore. Every few weeks there is another story about a malicious package sneaking onto PyPI or npm. Sometimes it hides behind a name that looks *just* close enough to something popular. Sometimes it is just brand new, hoping nobody looks too closely before enough people install it.

I got curious how hard it would be to keep an eye on that myself and put together a small automated pipeline that watches both registries for newly published or updated packages around the clock. Most of what shows up is not worth a second look. Before anything gets a deeper scan, it has to clear a quick filter: is this package unusually popular, does its name look like it is impersonating something well known, or is it brand new with basically no track record? Those are the characteristics that most open-source malware incidents take.

Anything that clears that bar gets scanned by an open-source malware scanner, [GuardDog](https://github.com/DataDog/guarddog). GuardDog looks for the kind of behavior that shows up in genuinely malicious packages. This includes things such as destructive file operations, code that spawns processes it has no business spawning, and code that goes out of its way to obscure what it is doing.

GuardDog can trip over its own blind spots. The same behavior it watches for can show up by coincidence in a legitimate package. This pipeline never publishes on GuardDog's analysis alone. Every finding needs to be corroborated by one of two third-party tools that each look at a different mix of signals.

The first is [Socket](https://socket.dev), which checks code behavior, package and maintainer metadata, and its own human-reviewed malware list. The second is [Aikido Security](https://www.aikido.dev), which publishes a free, public list of packages it has already confirmed as malware. Real malware does not always score high, and sometimes it cannot be scanned at all, especially if it has already been pulled from the registry by the time this pipeline gets to it.

This is a hobby project, not a security product. It will not catch everything, and it is one signal among many. It has been a fun way to get a little visibility into a corner of the open source ecosystem that attackers have been targeting heavily this past year.

<p id="findings-status" class="findings-status">Loading findings&hellip;</p>

<div id="findings-chart"></div>

<p class="coverage-note">Not every package that gets published or updated actually gets a GuardDog scan. Only what clears the triage filter above does. The pie charts below show roughly what share of real registry activity that filter covers. The npm figure counts every document revision the registry reports, including deprecations and maintainer edits, not just new versions.</p>

<div id="coverage-charts" class="coverage-charts">
  <div id="coverage-chart-npm" class="coverage-chart"></div>
  <div id="coverage-chart-pypi" class="coverage-chart"></div>
</div>

<div id="findings-list" class="findings-grid"></div>

{{< echarts "1px" "1px" >}}
{}
{{< /echarts >}}
