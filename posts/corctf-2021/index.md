# CorCTF - 2021


Lately, I've been keeping my eye out for interesting CTF's to compete in. This past weekend, the {{< link "https://ctftime.org/event/1364" "corCTF team">}} hosted their own event and boy was it a tough one. Being primarily a forensics guy, I was definitely out of my comfort zone with many of the challenges being binary exploitation, reversing, and cryptography. I clung onto anything that looked familiar and in the end was able to crack a web challenge for a few points. Here's to getting stronger with reversing + coding for the next go around!

## devme

In this challenge we were provided a pretty straightforward web page with a few buttons and a submission form. You can probably guess where my focus turned right out of the gate. Let's check out how user input gets handled.

{{< figure src="/images/devme_web1.webp" width="600" >}}

{{< figure src="/images/devme_web2.webp" title="Figure 1: Website preview" width="600" >}}

I fired up BurpSuite to see what happens when a test email address is submitted. Our content ends up getting POST'd to a `/graphl` endpoint and we receive some type of hashed username as the response.

{{< figure src="/images/devme_1.webp" title="Figure 2: Digging in with BurpSuite" width="1000" >}}

Seeing GraphQL in this challenge peeked my interest and I decided to spend some time learning about common attack scenarios with the technology. I stumbled across a pretty good video from Bugcrowd (below) that highlights a number of ways in which you can develop an attack methodology.

{{< youtube NPDp7GHmMa0 >}}

One way of performing reconnaissance with GraphQL is to see if introspection queries are allowed. Introspection queries essentially allow us to learn and gather information about what types of information the GraphQL endpoint accepts. It's generally not a good idea to enable introspection queries for a web app unless you specifically need to offer API services to clients. Let's see if our web application allows us to use them!

In order to easily manipulate GraphQL queries, I used the Chrome extension {{< link "https://chrome.google.com/webstore/detail/altair-graphql-client/flnheeellpciglgpaodhkhmapeljopja?hl=en" "Altair GraphQL Client">}}.

{{< figure src="/images/devme_3.webp" title="Figure 3: GraphQL schema query" >}}

By using a generic introspection query, we see that there are a number of various schema types that we can potentially interact with. The `User` and `Query` types looked interesting, I sought to dig further into them. The following screenshots show me fumbling through and gathering additional data.

{{< figure src="/images/devme_4.webp" width="850" >}}

{{< figure src="/images/devme_5.webp" title="Figures 3 + 4: User and Query types" width="850"  >}}

Interesting, we see that the `Query` type has something that potentially involves the flag. If we query the `flag` field directly, what happens?

{{< figure src="/images/devme_7.webp" title="Figure 5: flag query" width="850"  >}}

It looks like the `flag` field requires a token in order to return any information. Next, based on the previous schema queries and our original BurpSuite response, I figured that a `user` likely has a `username` and `token`. I attempted to query this (essentially dumping the database). Great success!

{{< figure src="/images/devme_6.webp" title="Figure 6: User info dump" width="850" >}}

We now have a dump of the user database and can use the `admin` token to query the `flag` field for the flag!

{{< figure src="/images/devme_8.webp" width="850" >}}
