---
title: "Splunking DLP data with a side of active response"
authors: ["devs"]
date: 2022-01-19
categories: ["blue-team"]
---

Recently, I was attending a corporate event via conference call and I noticed a distinct phrase being mentioned over and over by the event speakers. "Please refrain from taking screenshots of these slides as they are not meant for public disclosure." Sound familiar to anyone? How many people are actually going to abide by this suggestion?

For in-person events, this warning may be enough to ward off the rogue mobile phone picture taker...but let's face it...when people are at home, in their office, not thinking that they are being "watched", they definitely are going to take that screen capture (and potentially send it elsewhere). Don't believe me?

The following sections outline how I tested this theory and built out a very rough active response workflow for preventing data loss scenarios of this type.

## System Level Log Monitoring

I should mention before going further that although the latest wiz-bangy EDR tool isn't needed for this setup, there needs to be some method, tool, or mechanism of grabbing system level file creation events from the to-be monitored devices (preferably quickly). 

For those unfamiliar, there are some great free and lower-priced tools out there that can be deployed for this purpose. Some of these tools include {{< link "https://docs.velociraptor.app/" "Velociraptor" >}} and everyone's favorite, {{< link "https://www.trustedsec.com/tools/trustedsec-sysmon-community-guide/" "Sysmon" >}}. Additionally, for macOS systems, the product {{< link "https://www.jamf.com/products/jamf-protect/" "Jamf Protect" >}} works very well for remotely collecting Apple Unified Log events.

Most organizations these days are sending various categories of event logs to a SIEM (i.e. Splunk) and endpoint data should be no different. Features such as {{< link "https://docs.splunk.com/Documentation/Splunk/8.2.4/Data/UsetheHTTPEventCollector" "Splunk HEC" >}} and Universal Forwarders make it easy to pull in this information from the hosts themselves or out of endpoint product consoles.

So what do we look for in the event logs? In the example scenario of a meeting participant taking an "unauthorized" screen capture of sensitive content, it's pretty easy. Any file creation events that occur from the devices default screen capture application (i.e. SnippingTool, com.apple.screencapture, etc.) are likely to be files of interest.

Jamf Protect even comes with an {{< link "https://docs.jamf.com/jamf-protect/documentation/Security.html" "out-of-box analytic" >}} for screenshots being taken on a system.

But what about individuals that are using non-native, third-party screen capture tools? Performing an inventory of software applications that are installed on systems is a good start. After this, gathering information around the process flow for these applications is a good next step. Finally, adjust Sysmon, Velociraptor, other endpoint agent queries as needed once the general process patterns are identified to capture the screenshot file creation events.  

Now that the event has been logged, a SHA256 hash should be included within the event. We can utilize Splunk's search scheduling to regularly populate a lookup file with any and all file hashes that are observed from the screenshot events. An example of this query could be:

````
index=endpoint event_name="Screenshot Taken"
| dedup sha256hash
| table sha256hash
| outputlookup append=t screenshot_hashes.csv
````

 But now what?

## Active Response Actions
Splunk alert actions are great ways of integrating Splunk with other systems and Security, Orchestration, Automation, and Response (SOAR) platforms. With regards to the screenshot use case, one configuration that could be put in place is that, on a regular interval, Splunk can send the file hashes included in the previously created lookup file to a SOAR platform. The SOAR platform can interface with the organization's DLP product, email platform, etc. to block the specified file hashes from being transferred to external locations. Email continues to be one of the most common mechanisms for data exfiltration by insider threat actors.

{{< figure src="/images/dlp_data_flow.webp" width="700" >}}

I'm no expert when it comes to data loss prevention (DLP) and there are definitely far better (and expensive product) methods for performing what I outlined today. Like with other areas of blue-teaming, having a defense in depth strategy with multiple ways of detecting and remediating risks is important. Hopefully this post has outlined a creative and inexpensive method for assisting with a data loss prevention use case.

---

{{< link "https://www.flaticon.com/free-icons/user" "User icons" >}} created by Freepik - Flaticon.  
{{< link "https://www.flaticon.com/free-icons/screenshot" "Screenshot icons" >}} created by Freepik - Flaticon.  
{{< link "https://www.flaticon.com/free-icons/development" "Development icons" >}} created by Freepik - Flaticon.