---
layout: post
title: "Configure SIP phone for Elastix PBX"
comments: false
description: "Configure SIP phone for Elastix PBX"
keywords: "sip, elastix, asterisk, nokia, e63, voip"
---

> VoIP: _Elastix PBX_  
> Phone: _Nokia E63_    

___

1. From your phone, go to;  
`Menu > Tools > Settings > Connection > SIP Settings`.  
Choose `Options` and select `Add New`.  
Select `Use Default Profile`.  
```
[Sample configuration - Change only the following settings in the profile while leaving others as default]
Profile Name: VOIP_company_name
Public Username: xxx@1.2.3.4      <-  xxx - IP phone extension; 1.2.3.4 - Elastix server IP
Proxy Server: 5.6.7.8           <-  If any, then use the Proxy server IP (5.6.7.8); otherwise leave it blank
Realm: password
Username: your_name
Password: your_password
Allow loose routing: Yes
Transport Type: UDP
Port: 5060
Register Server: 1.2.3.4          <-  Elastix server IP
Proxy server address: 5.6.7.8     <-  It will be blank if there is no proxy server
```

2. From your phone, go to;  
`Menu > Tools > Settings > Connection > Internet Tel. Settings` and choose the newly created SIP configuration (e.g. *VOIP_company_name*).

3. After selecting the name, choose the `SIP Profiles` and press `OK`.

4. To check your SIP status, go to;  
`Menu > Connect > Internet Tel. Registration Status`.  
You should see the name in the list and it will show as `Not Registered`.  
Press `OK` and soon your phone will registered with the Elastix PBX.
