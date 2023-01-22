---
title: "Random SharePoint 2016 Troubleshooting"
comments: false
description: "Random SharePoint 2016 Troubleshooting"
keywords: "sharepoint, 2016, blob, cache, web application, availability, monitor, start, stop, distributed cache, os, version, architecture, hostname, domain, cname, processors, ram, disks, ip address, licensing status, uac, firewall, snmp, rdp scan, administrators, users, disk, spacec, smtp"
published: false
---
#### "Database is in compatibility range and upgrade is recommended"

1. Go to `CA > Upgrade and Migration > Review database status` and find if the database `Status` is showing as `Database is in compatibility range and upgrade is recommended`

2. It can also be checked by running the following command in `SharePoint 2016 Management Shell`;
```
stsadm -o LocalUpgradeStatus
```
Sample output:
```
...
[11] content database(s) encountered.
[1] content database(s) still need upgrade or cannot be upgraded.
[11] site collection(s) are contained in the content databases.
[0] site collection(s) still need upgrade.
[49] other objects encountered, [0] of them still need upgrade or cannot be upgraded.
```

3. Run the following command in `SharePoint 2016 Management Shell` to upgrade the database;
```
Get-SPWebApplication "http://WebApplication1:9999" | Get-SPContentDatabase | Upgrade-SPContentDatabase
```
Sample output:
```
Confirm
Are you sure you want to perform this action?
Performing the operation "Upgrade-SPContentDatabase" on target
"SharePoint_AdminContent".
[Y] Yes [A] Yes to All [N] No [L] No to All [S] Suspend [?] Help (default is "Y"):Y
100.00% : SPContentDatabase Name=SharePoint_AdminContent
Finalizing the upgrade...
```

4. Go to `CA > Upgrade and Migration > Review database status` and now it will show as `No action required`

---

#### "Expired sessions are not being deleted from the ASP.NET Session State database."

1. From `SharePoint 2016 Management Shel`l, run the following to disable `Session State Service`;
```
PS > Disable-SPSessionStateService
```

2. Enable `Session State Service` while specifying database server hostname and database name;
```
PS > Enable-SPSessionStateService -DatabaseServer SPDB2016 -DatabaseName SP_StateService
```

3. Check `Session State Service` status;
```
PS > Get-SPSessionStateService
```
Sample output:
```
Enabled Timeout  Database Server      Database Catalog     Database Id
------- -------  ---------------      ----------------     -----------
True    01:00:00 SPDB2016             SP_StateService      d914996f-0604-40ba-9dd1-0d15a3d482e3
```

---

#### "ULS log are not writing in Diagonstic folder"

This can happen when we start sharing the log folder with other users. To solve issue, do the following;
1. Go to `Services` and find which user is running `SharePoint Tracking Service`;

2. Go to `Computer Management > Local Users and Groups > Group > Performance Log Users`. Add `SharePoint Tracking Service account` (Default is `Local Service`) to `Performance Log Users` group  

3. Check the log folder and if it still does not start writing in the folder, then restart `SharePoint Tracking Service` from `Services`

4. Also verify if the following users have `Read`, `Write` and `Special Permission` on the log folder;  
```
WSS_RESTRICTED_WPG_V4(Server1\WSS_RESTRICTED_WPG_V4)
WSS_ADMIN_WPG(Server1\WSS_ADMIN_WPG)
WSS_WPG(Server1\WSS_WPG)
```

---
