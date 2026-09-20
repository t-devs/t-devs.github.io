# GuidePoint Security CTF - August 2021


It's been a while since I had a chance to sit down and tackle a CTF. Lucky for me, GuidePoint Security recently ran their {{< link "https://www.guidepointsecurity.com/resources/guidepoint-security-capture-the-flag-august-10/" "August iteration" >}} and it gave me a chance to brush off some cobwebs! I wasn't able to solve all the challenges (damn you Python!) but had a pretty good idea on how to approach most of 'em. Below are some write-ups on ones that I had fun trying to solve.

## Twisting seA

For this Crypto challenge we were given a block of what appeared to be hex code. 

```text
4d6a41354d57466b4d7a5a6b4d7a5978597a67345a44566a4d7a49774d6d557a4e6d51354e7a56684d4455304e5455314e3249304e54426b4e575a6b59575a684d575
1324d6a41334f575978596a59324f444e684d6d5131593256684e6a646c5a6a41345a544d79595464684d5455345a54566a5a47517a4f4451344e544e6b4947733959
325a6b597a41785a546b305a6d51334d6a67784f5445314f54677a4d474e6c4f4455335a6d4d784f5441676154307859546c6b5a5759354f4456684d7a4d794e7a593
24d544a694e5449784e6d49325932597a5a44466c4f413d3d
```

Like in many other challenges, starting with {{< link "https://gchq.github.io/CyberChef/" CyberChef >}} can be a good first route when dealing with data formatting. Sure enough, if we transform the text "From Hex" we get a Base64 string that we can decode with CyberChef as well. This leaves us with the following.

{{< figure src="/images/twistingseA_1.webp" title="Figure 1: CyberChef Hex decode" width="800">}}

Hmm, we see a `k` and an `i` variable. Being that this is a crypto challenge, maybe this is a key and an initialization vector? A quick search on Google for encryption algorithms that use keys and initialization vectors brings up block ciphers. One of the most common encryption methods out there, AES, is a block cipher. What's more is that the name of this challenge actually has AES in it (just backwards). Let's see if CyberChef can help us out again with its decryption recipe.

{{< figure src="/images/twistingseA_2.webp" title="Figure 2: CyberChef AES decrypt" width="700" >}}

Well, we provided all the correct information in the recipe but the output string we receive isn't in the flag format. It looks close, but no cigar. What if we change the data format on the `k` or `i` variables?

{{< figure src="/images/twistingseA_3.webp" title="Figure 3: CyberChef AES decrypt" width="700" >}}

Bingo! The initialization vector was in regular UTF8 encoding and not in hex. We can submit this flag and claim our points!

---

## Sharkfail

In this challenge, we're provided a PCAP file named sharkfail.pcapng. I smell a forensics problem!

As we load up Wireshark to start taking a peak at things, we're prompted with an error message about a potentially corrupt capture file. Interesting...let's keep digging.

{{< figure src="/images/sharkfail_1.webp" title="Figure 4: Corrupted PCAP" width="400" >}}

One thing I like to do with PCAP challenges is to look at the protocol distributions within the capture. This can be done through Statistics -> Protocol Hierarchy. We see that most the communication in this capture takes place over USB. Nice, we likely have some data transfer occurring.

{{< figure src="/images/sharkfail_2.webp" title="Figure 5: Protocol Hierarchy" width="700" >}}

If we do a bit of Googling on which fields / areas in Wireshark to look for with USB forensics, we stumble upon the field `usb.capdata`. If we apply this as a filter in Wireshark, we can observe a ton of "URB_BULK in" events that have occurred. There's a good chance our flag is probably somewhere in these data transfer events.

{{< figure src="/images/sharkfail_3.webp" title="Figure 6: Wireshark usb.capdata" width="1000" >}}

At this point, I said to myself, "How can we get this data out of Wireshark to decode and perform further analysis?". Unfortunately, after much trial and error, I learned that Wireshark doesn't appear to support the exporting of USB data objects (or at least I couldn't find a way...). Well shucks....where to next? How about Wireshark's GUI-less brother `tshark`?

Similar to Wireshark, filters can be applied when searching through capture traffic. We can take the output of `usb.capdata` events and attempt to replicate what Wireshark was showing us earlier. The tool `xxd` is our friend here.

```bash
tshark -r sharkfail.pcapng -T fields -e usb.capdata -Y usb.capdata | xxd -r -p | xxd > decoded.raw
```

This gives a raw hex dump file, `decoded.raw`, that we can dig into further. What we start to notice here is that there are a handful of human-readable characters showing throughout the hex dump.

{{< figure src="/images/sharkfail_4.webp" title="Figure 7: usb.capdata hex dump" width="550" >}}

This is where things got tricky for me. No matter what I tried, I could not seem to figure out anything relating to a flag within this data. During other CTF's, once I've gotten to the point of dealing with a hex dump from a capture, it's typically time to start file carving. Finding corrupted or mismatched file headers in the hex dump, attempting to rebuild files from scratch, or looking further at patterns in the hex data itself would be smart directions to turn...but I'm not smart.

It was getting late and I was feeling defeated...I decided to throw everything but the kitchen sink at the hex file as well as the original PCAP. That's when it happened...

{{< figure src="/images/sharkfail_5.webp" title="Figure 8: Strings of PCAP" width="600" >}}

When in doubt, `strings` it out! This group of characters at the top appeared unique within the file and looked like it was in a familiar data format. Sure enough if we decode the characters from base 64, we have our flag.

{{< figure src="/images/sharkfail_6.webp" title="Figure 9: Base64 Decode" width="1000" >}}

I definitely don't think I solved this challenge as it was intended and I imagine the .pcapng file being corrupted likely had something to do with things but hey, I'll take what I can get! 

---

Shout out to {{< link "https://twitter.com/offsec_ginger" "Alex Williams">}} and {{< link "https://www.guidepointsecurity.com" "GuidePoint Security">}} for putting on a great event. I'm looking forward to the next one!
