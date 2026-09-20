---
title: "SOC work. A walk through the trenches. [Part 1]"
authors: ["devs"]
date: 2021-08-08
categories: ["careers"]
series: ["my-journey-in-cybersecurity"]
featuredImage: "military.webp"
---

It's no secret that working in a Security Operations Center (SOC) can be a demanding, thankless, and tough job (with it only getting tougher). This is especially true for folks just getting started in the industry who are building the foundational skills required for career progression. Working long hours, weekends, holidays...this is the side of cyber they don't tell you about... If you're not prepared for it, you might start asking yourself "What the hell did I just get myself into?". I know I did...

Over the last several years, I've somehow managed to convince my peers enough that I know what I'm doing. This has granted me the opportunity to hold a handful of positions either operating in or working closely with SOC teams. I hope through these blog posts I can shed some light on the lessons that I've learned working on the front lines. If nothing else, if I can encourage any beat-up, stressed-out, and just plain tired folks in the industry to keep up the good fight, then this series will have been a success.

## In the beginning

Starting in 2015, I began my voyage trying to break into the InfoSec field as naive college student eager to find my first gig. I had somehow managed to snag an internship earlier in the year working at a cybersecurity start-up that specialized in consulting. You know...what could be better than having the new intern bang on keyboards inside million dollar customer networks?

{{< figure src="/images/no_idea_dog.webp" width="400" >}}

Okay, okay...it wasn't that glamorous. Honestly, the typical day for me could be summarized as:
* Googling. Lots and lots of Googling. (This hasn't changed)
* Reading and learning a ton about security vendors, products, you name it from blogs.
* Spending 30 minutes trying to wrangle an unwieldy corporate VMware environment.

I guess I did something right because shortly after I managed to get hired on as an entry-level SOC analyst within the same company. I was feeling pumped! All my hard work and hundreds of hours spent learning security finally felt worth it. I saved no time diving head first into the role and learning all that I could about Splunk and incident response. I was like a kid in a candy store with all the new tools and technologies I was being exposed to. There was just one problem... Our small start-up SOC had become inundated with a ton of security alerts to review.

{{< figure src="/images/fp_overload.webp" width="300" >}}

## Rough waters

 If there's one thing that can kill a SOC team's motivation and drive to learn, it's event overload and triaging the same noisy alerts day in, day out. Sounds like the definition of insanity, doesn't it? This quickly becomes a slippery slope with the unfortunate part being that it's not a unique problem affecting a few organizations here and there...it impacts a large majority of companies.

So what happens if false positive alert fatigue is not solved early? In my experience, nothing good.

* Career growth and progression is stunted.
* Additional stress is added onto an already stressful position (more on this in the next post).
* An increased probability that actual security incidents won't be properly detected.

Alert management itself effectively becomes a game within the game for SOC teams. But there has to be a way of solving this right? Right? Well, this can be a tough cookie to crack. In my opinion, a number of things need to happen to move things in the right direction.

1. **Have a desire to be lazy** - The adage of "if you have to do something more than once, script it out" couldn't be more true in information security and IT in general. It's obviously easier said than done for some cases, however, putting the time in up front goes a long way. Something as small as {{< link "https://github.com/yeti-platform/yeti" "automating IOC enrichment look-ups" >}} with third party tools (VirusTotal, Shodan, etc.) or creating {{< link "https://docs.aws.amazon.com/whitepapers/latest/aws-security-incident-response-guide/infrastructure-domain-incidents.html" "AWS Lambda functions" >}} that react to certain events end up saving a ton of time!  

2. **Actionable, risk-based alerting** - Only trigger alerts for the SOC that require further action. Many compliance frameworks (cough PCI cough) still to this day require enabling alerts for tasks and behaviors that, for some organizations, happen hundreds of times per day. Elevated Windows security group modifications anyone? This is where {{< link "https://conf.splunk.com/files/2019/slides/SEC1538.pdf" "risk-based alerting" >}} can help. In its most basic sense, risk-based alerting could be as simple as only triggering specific alerts for domain admins or high-risk users that are continuously failing simulated phishing tests. In a more complex configuration, risk-based alerting can involve noisy alerts still being configured, however, instead of notifying the SOC, a "risk" score counter is automatically adjusted for the asset or identity involved. Defenders are then able to monitor for users and systems with increasing risk scores in the environment over time.

3. **Prioritize learning and development over alert SLAs** - This one personally hits home with what I experienced and observed early on in my career. In far too many scenarios (especially in managed security service organizations) I've observed that alert counts and SLAs become the main focus of the business instead of facilitating learning and development. Why is this? Simple, you can easily quantify alerts and time. It's important for defenders (especially newcomers in the field) to learn the ins and outs of various operating systems. They need to learn the various obfuscation techniques that attackers use to bypass security controls. They need to learn to script and code so that challenging problems can be solved faster. This won't happen when alert ticket queue SLAs control job performance.

As I look back at my first and second years working in the industry on a small SOC team, I am truly grateful for the experience that it offered me. I learned what it meant to work on a team and to utilize the strengths of others to tackle tough challenges. It was one hell of a ride during the early times for sure.

Stay tuned for Part 2 of this blog series where I'll be diving into the next few years of my cyber adventure and how I began my battle with the beast that is known as job burnout.