---
title: "Random F5 iRules"
comments: false
description: "Random F5 iRules"
keywords: "F5, iRules, example"
published: false
---

#### URL/URI  
URL consists of HOSTNAME and URI ->> `URL = https://[HTTP::host][HTTP::uri]`  
URI consists of PATH and QUERY ->> `[HTTP::uri] = [HTTP::path][HTTP::query]`  

Example: `https://example.com/admin/login.html?service=discovery.com/loginID=8598495`  

where;  
`[HTTP::host]` = `example.com`  
`[HTTP::uri]` = `/admin/login.html?service=discovery.com/loginID=8598495` (everything after hostname)  
`[HTTP::path]` = `/admin/login.html` (everything after hostname and before ?)  
`[HTTP::query]` = `service=discovery.com/loginID=8598495` (everything after ?)  

---

#### Permanent redirect all traffic to a new host but keep the URI  

_You have_:  
`https://example.com/`  
`https://example.com/apps/login.jsp`  

_You want_:  
`https://example.com/` to be redirected to `https://discovery.com`  
`https://example.com/apps/login.jsp` to be redirected to `https://discovery.com/apps/login.jsp`  

_iRule_:
```
when HTTP_REQUEST {
  HTTP::respond 301 Location "https://discovery.com[HTTP::uri]"
}
```
To do a temporary redirect, use 302 as `HTTP::respond`.

---

#### Redirect only root path(/) to a different host without redirecting nested URI's  

_You have_:  
`https://example.com/`  
`https://example.com/index.html`  
`https://example.com/apps/login.jsp`  

_You want_:  
`https://example.com/` to be redirected to `https://discovery.com`  
`https://example.com/index.html` to be redirected to `https://discovery.com`  
`https://example.com/apps/login.jsp` will stay as it is  

_iRule_:
```
when HTTP_REQUEST {
  switch -glob [string tolower [HTTP::uri]] {
    "" -
    "/" {
      HTTP::redirect "https://discovery.com"
    }
    "/index.html" {
      HTTP::redirect "https://discovery.com"
    }
    default {
    }
  }
}
```

---

#### URL redirect while keeping HTTP query

_You have_:  
`https://example.com/admin/login.html?service=discovery.com/loginID=8598495`  
`https://example.com/developer/login.html?service=discovery.com/loginID=8598495`  
`https://example.com/user/login.html?service=discovery.com/loginID=8598495`

_You want_:  
`https://example.com/admin/login.html?service=discovery.com/loginID=8598495` to be redirected to `https://example.com/admin_new/login.html?service=discovery.com/loginID=8598495`  
`https://example.com/developer/login.html?service=discovery.com/loginID=8598495` to be redirected to `https://example.com/developer_new/login.html?service=discovery.com/loginID=8598495`  
`https://example.com/user/login.html?service=discovery.com/loginID=8598495` to be redirected to `https://example.com/user_new/login.html?service=discovery.com/loginID=8598495`  

_iRule_:
```
when HTTP_REQUEST {
  switch -glob [string tolower [HTTP::path]] {
    "" -
    "/" {
      HTTP::redirect https://[HTTP::host]/console/login.html
    }
    "/admin/login.html" {
      HTTP::redirect https://[HTTP::host]/admin_new/login.html?[HTTP::query]
    }
    "/developer/login.html" {
      HTTP::redirect https://[HTTP::host]/developer_new/login.html?[HTTP::query]
    }
    "/user/login.html" {
      HTTP::redirect https://[HTTP::host]/user_new/login.html?[HTTP::query]
    }
    default {
    }
  }
}
```

---

#### Filter user access to a particular URI based on network 

_You have_:  
`https://example.com/admin`  

_You want_:  
Users only from a particular network (192.168.1.0/24) to be able to access `https://example.com/admin`. Users outside of this network will be redirected to home page if they try to visit /sysadmin. 

_Prereq_:
1. Create a txt file with the following content (make sure that there is no EOL);
```
network 192.168.1.0 mask 255.255.255.0
```

2. Go to `System > File Management > Data Group File List`. Click on Import, upload the file. Give it a Name (allowed_network), select Address as File Contents and a Data Group Name (allowed_network).  

_iRule_:
```
when HTTP_REQUEST { 
    if { ([string tolower [HTTP::uri]] ends_with "/admin/") and not ([class match [IP::client_addr] equals allowed_network]) } {
    HTTP::redirect "https://example.com"  
    } 
  }
```

NB: In here, we are using External File to define the network. You can also define the network without using external file. To do that, go to `Local Traffic > iRules > iRules List > Data Group List`. Click on Create, give it a Name (allowed_network), select Type as Address and then add the network.


---
