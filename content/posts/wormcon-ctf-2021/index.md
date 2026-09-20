---
title: "WORMCON CTF - 2021"
authors: ["devs"]
date: 2021-08-30
categories: ["ctf"]
featuredImage: "wormcon.webp"
---

WORMCON CTF occurred this weekend and I had a fun time digging through a handful of Forensics and Networking challenges.

## Network At Risk (Part 2)

This challenge provided a PCAP file that contained quite a bit of FTP traffic. As I'm sure most know, FTP does not encrypt data while in transit. This provided me with a good starting point to try and gather some information. 

{{< figure src="/images/network2_1.webp" title="Figure 1: Protocol hierarchy" width="800">}}

Sure enough, one of the first things I noticed in the FTP requests is a username and password. I'll hold onto this information for later. 

{{< figure src="/images/network2_2.webp" title="Figure 2: FTP login" width="800">}}

Next I decided to look for any interesting files that would've been transferred in this session. I saw a `B4ckF1r3.zip` file a bit later on in the PCAP. Maybe we can export this file from the PCAP to see what's inside?

{{< figure src="/images/network2_3.webp" title="Figure 3: Interesting file" width="800">}}

Wireshark makes it easy enough to export HTTP objects from a capture, but what about data from other protocols? I'll need to dive into file carving for this. A quick Google search shows that .zip files begin with a hex file header of `50 4B 03 04`. I searched for this in the PCAP to find when the zip file would've been transferred. A quick "Follow TCP Stream" of packet `7788` will bring up a window where raw packet data can be exported.

{{< figure src="/images/network2_4.webp" title="Figure 4: Zip file search" width="800">}}

{{< figure src="/images/network2_5.webp" title="Figure 5: Zip file export" width="800">}}

At this point, it's fairly trivial save the raw `B4ckF1r3.zip` file and attempt to unzip the archive. The archive looks to require a password in order to un-compress. The password `pl3as3S4v3Th3w0rmC0n` that was observed earlier unzips things successfully and a shell script contains the flag.

{{< figure src="/images/network2_6.webp" title="Figure 6: Flag shell script" width="400">}}

---

## Network At Risk (Part 3)

I continued down the PCAP analysis road and attempted to tackle Part 3 of the Network at Risk challenges. At first glance for this one, I noticed that ~90% of the packets in this PCAP related to Real-time Transport Protocol (RTP). A little research shows that RTP is typically used for VoIP. This gave me the hint that I likely needed to recover an audio file with the flag.

{{< figure src="/images/network3_1.webp" title="Figure 7: Protocol hierarchy" width="800">}}

Additionally, I noticed with this capture that there were a handful of DNS requests. These packets actually gave me a hint on which tool could be used to solve the challenge. Xplico, specifically the PCAP2WAV tool, allows for network capture files to be decoded into WAV audio files.

{{< figure src="/images/network3_2.webp" title="Figure 8: DNS requests">}}

I checked out https://pcap2wav.xplico.org and uploaded the network capture. This spat out two WAV files that I could listen to where the phrase "welcome to the world of voip" was repeated several times. This ended up being the flag, `wormcon{welcome_to_the_world_of_voip}`.

{{< figure src="/images/network3_3.webp" title="Figure 9: Xplico PCAP2WAV" width="900">}}

---

## Network At Risk (Part 4)

Last but not least, I dove into Part 4 of this challenge series. With this network capture, I observed a bunch of 802.11 packets. This suggested that wireless networks would likely be involved.

{{< figure src="/images/network4_1.webp" title="Figure 10: Protocol hierarchy" width="800">}}

I took particular attention to the 802.1x authentication packets and learned from these that WPA was likely being used. WPA (TKIP) is an inherently insecure protocol for wireless networks and allows attackers to be able to brute force the network password if specific packets are captured / sniffed. Lucky for us, these packets are contained in this PCAP.

{{< figure src="/images/network4_2.webp" title="Figure 11: WPA handshake" width="800">}}

 Aircrack-ng is the tool of choice for this challenge. With the WPA authentication handshake packets in hand, my goal was to try and offline crack what the pre-shared WPA key for the `DeathStar` wireless network would've been. I fed the entire PCAP into Aircrack-ng and loaded the wordlist, `rockyou.txt`, that comes with Kali Linux. Before long, I had the WPA password as well as enough information for this challenges flag, `wormcon{P@$$w0rd_82:25:fa:ee:ed:91}`.

 {{< figure src="/images/network4_3.webp" title="Figure 12: Aircrack-ng PSK brute-force" width="600">}}

---

## wormonetics - Part 1

It's been a while since I've seen a forensics challenge involve a full system disk image like this one had. At work, I've been diving quite a bit into forensics and saw this as an opportunity to fire up Autopsy to try and solve this one.

Given the disk image, the goal of this first challenge was to try and find the email address of a threat actor that one of the fictitious company's employees was interacting with. Additionally, part of the flag also required us finding what our insider's first name was. I installed Autopsy and got to digging.

{{< figure src="/images/wormonetics1_1.webp" title="Figure 13: Autopsy image" width="800">}}

Autopsy makes it easy to sift through system artifacts and parse out items of interest. Specifically, there is a section within `Data Artifacts` called `E-mail Messages`. This is where I found a peculiar email message that our intern, `harry` had sent to `hackwithdark@outlook.com` on 08/06/2021. We can place these two pieces of information into flag format and claim our points, `wormcon{harry_hackwithdark@outlook.com}`.

{{< figure src="/images/wormonetics1_2.webp" title="Figure 14: Hacker email" width="900">}}

---

## wormonetics - Notes

I unfortunately didn't have the time to get through the rest of the wormonetics challenges before WORMCON CTF ended but I did see an additional file of interest that I imagine would've been helpful in finding additional flags. If I get some time in the near future I will try and see about solving Part 2 and 3!

Within the `E-mail Messages` section of Autopsy I noticed a `Get Your Offer.eml` message that had an oddly named attachment.

{{< figure src="/images/wormonetics3_1.webp" width="500">}}

{{< figure src="/images/wormonetics3_2.webp" title="Figure 15: Suspicious email" width="600">}}

If we check the hash for this archive file in VirusTotal, a number of vendors denote the archive, along with the XLS spreadsheet inside as malicious.

https://www.virustotal.com/gui/file/5df39c1987aa27b76921ba626aa22dca22978d576ed06e34a81ea00eb0dc8ff2/detection

It's likely that the XLS file contains VBA macros which can be reversed. Malicious Microsoft Office files typically serve as droppers / downloaders for other types of malware. I suspected that Part 2 or 3 of this challenge series involved digging through the VBA code. 

My go-to tool for extracting malicious Office VBA macros is {{< link "https://github.com/DidierStevens/DidierStevensSuite/blob/master/oledump.py" "oledump">}} by Didier Stevens. I took a quick peak at the `annual_report.xls` file and extracted the macros.

{{< figure src="/images/wormonetics3_3.webp" title="Figure 16: VBA Macros" width="500">}}

A common technique that I've observed malware authors use with malicious macros is to encode various command execution strings as blobs of data in VBA code. The array being instantiated in the 2nd VBA macro of the XLS file caught my eye and I suspect contains further information for uncovering the flag for this challenge.

{{< figure src="/images/wormonetics3_4.webp" title="Figure 17: Suspicious array">}}