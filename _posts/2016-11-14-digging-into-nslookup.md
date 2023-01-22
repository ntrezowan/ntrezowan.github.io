---
title: "Digging into NSLOOKUP"
comments: false
description: "Digging into NSLOOKUP"
keywords: "nslookup, example, a-record, ns-record, mx-record, srv, dns query, windows"
published: false
---

1. A-record - This record outputs the IP address of a domain (e.g. google.com). It also shows which DNS server is doing the forward lookup and in this example, it's `cdns01.comcast.net`;  
```
PS > nslookup -querytype=a google.com
Server:  cdns01.comcast.net
Address:  2001:558:feed::1
Non-authoritative answer:
Name:    google.com
Addresses:  74.125.196.102
          74.125.196.101
          74.125.196.138
          74.125.196.113
          74.125.196.100
          74.125.196.139
```

2. NS-record - This record output all the Non-authoritative DNS servers information of a domain (e.g. google.com);  
```
PS > nslookup -querytype=ns google.com
Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
Non-authoritative answer:
google.com      nameserver = ns3.google.com
google.com      nameserver = ns2.google.com
google.com      nameserver = ns1.google.com
google.com      nameserver = ns4.google.com  
ns1.google.com  internet address = 216.239.32.10
ns4.google.com  internet address = 216.239.38.10
ns3.google.com  internet address = 216.239.36.10
ns2.google.com  internet address = 216.239.34.10
```

3. MX-record - This record outputs all the mail server information of a domain (e.g. google.com);  
```
PS > nslookup -querytype=mx google.com
Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
Non-authoritative answer:
google.com      MX preference = 40, mail exchanger = alt3.aspmx.l.google.com
google.com      MX preference = 20, mail exchanger = alt1.aspmx.l.google.com
google.com      MX preference = 10, mail exchanger = aspmx.l.google.com
google.com      MX preference = 50, mail exchanger = alt4.aspmx.l.google.com
google.com      MX preference = 30, mail exchanger = alt2.aspmx.l.google.com  
alt2.aspmx.l.google.com internet address = 64.233.190.27
alt3.aspmx.l.google.com internet address = 209.85.202.26
aspmx.l.google.com      internet address = 74.125.21.27
aspmx.l.google.com      AAAA IPv6 address = 2607:f8b0:4002:c0c::1b
```

4. SRV-record - This record outputs information such as serial, priority, primary mail server etc. of a domain (e.g. google.com);  
```
PS > nslookup -querytype=srv google.com
Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
google.com
        primary name server = ns4.google.com
        responsible mail addr = dns-admin.google.com
        serial  = 151951995
        refresh = 900 (15 mins)
        retry   = 900 (15 mins)
        expire  = 1800 (30 mins)
        default TTL = 60 (1 min)
```

5. To specify a particular DNS (e.g. OpenDNS) to resolve a domain name (e.g. google.com) instead of own ISP DNS;  
```
PS > nslookup google.com 208.67.222.222
Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
Non-authoritative answer:
Name:    google.com
Addresses:  74.125.196.102
          74.125.196.101
          74.125.196.138
          74.125.196.113
          74.125.196.100
          74.125.196.139
```

6. To specify a port for a DNS query;  
```
PS > nslookup -port 67 google.com
Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
Non-authoritative answer:
Name:    google.com
Addresses:  74.125.196.102
          74.125.196.101
          74.125.196.138
          74.125.196.113
          74.125.196.100
          74.125.196.139
```

7. Debugging will show all the packet exchanged while resolving a DNS record;  
```
PS > nslookup
Default Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
> set debug
> google.com
Server:  cdns01.comcast.net
Address:  2001:558:feed::1  
------------
Got answer:
    HEADER:
        opcode = QUERY, id = 2, rcode = NOERROR
        header flags:  response, want recursion, recursion avail.
        questions = 1,  answers = 6,  authority records = 0,  additional = 0  
    QUESTIONS:
        google.com, type = A, class = IN
    ANSWERS:
    ->  google.com
        internet address = 74.125.21.138
        ttl = 67 (1 min 7 secs)
    ->  google.com
        internet address = 74.125.21.139
        ttl = 67 (1 min 7 secs)
    ->  google.com
        internet address = 74.125.21.100
        ttl = 67 (1 min 7 secs)
    ->  google.com
        internet address = 74.125.21.101
        ttl = 67 (1 min 7 secs)
    ->  google.com
        internet address = 74.125.21.102
        ttl = 67 (1 min 7 secs)
    ->  google.com
        internet address = 74.125.21.113
        ttl = 67 (1 min 7 secs)  
------------
Non-authoritative answer:
------------
Got answer:
    HEADER:
        opcode = QUERY, id = 3, rcode = NOERROR
        header flags:  response, want recursion, recursion avail.
        questions = 1,  answers = 1,  authority records = 0,  additional = 0

    QUESTIONS:
        google.com, type = AAAA, class = IN
    ANSWERS:
    ->  google.com
        AAAA IPv6 address = 2607:f8b0:4002:c06::8a
        ttl = 179 (2 mins 59 secs)  
------------
Name:    google.com
Addresses:  2607:f8b0:4002:c06::8a
          74.125.21.138
          74.125.21.139
          74.125.21.100
          74.125.21.101
          74.125.21.102
          74.125.21.113  
>
```
