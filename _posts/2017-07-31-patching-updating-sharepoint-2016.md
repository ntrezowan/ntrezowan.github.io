---
title: "Patching/Updating SharePoint 2016"
comments: false
description: "Patching/Updating SharePoint 2016"
keywords: "sharepoint, 2016, patch, upgrade, update, farm"
published: true
---
1. Download SharePoint 2016 update releases from Microsoft website;  
[https://technet.microsoft.com/en-us/library/mt715807(v=office.16).aspx](https://technet.microsoft.com/en-us/library/mt715807(v=office.16).aspx).  
Check Todd Klindt’s website to find what type of updates each version has including the build number;  
[http://www.toddklindt.com/blog/Builds/SharePoint-2016-Builds.aspx](http://www.toddklindt.com/blog/Builds/SharePoint-2016-Builds.aspx)

2. Open `SharePoint 2016 Management Shell` and run the following command to take a full backup of the current farm;  
```
PS > Backup-SPFarm -Directory <BackupFolder> -BackupMethod Full -Verbose
```

3. Stop `Search Service Application` on the Search servers since we do not want Search to crawl while patching. Run the following command to stop Search Service Application;  
```
PS > Suspend-SPEnterpriseSearchServiceApplication –Identity “Search Service Application”
```  
Go to `CA > General Application Settings > Farm Search Administration > Search Server Application` and now `Administrative Status` will show as `Paused: for external request`.

4. Remove the web fronts from load balancer and install the update on the web fronts first. This way, if we encounter any issue after patching, it will not break any of the application servers. Reboot the web fronts if necessary.  
After reboot, check if the updates are properly installed by going to `Control Panel > Program and Features > View Installed Updates`. Also, open CA from the web fronts to see if IIS is working or not

5. Install the update in Application Servers and reboot if necessary.  
After reboot, check if the updates are properly installed by going to `Control Panel > Program and Features > View Installed Updates`. Also, open CA from the application servers to see if IIS is working or not 

6. Remove `WSS_Logging` database from Availability Group if there are two SQL servers in a cluster with Always On Availability

7. At first, run `SharePoint 2016 Products Configuration Wizard` at the server where CA is installed. When it finishes, open CA to verify the server status.  
You can also run Configuration Wizard from Management Shell using the following command;   
```
PS > psconfig.exe -cmd helpcollections -installall -cmd secureresources -cmd services -install -cmd installfeatures -cmd applicationcontent -install -cmd upgrade -inplace b2b -force -wait
```

8. Run Configuration Wizard in the web fronts and other application servers

9. Run the following command to check `Configuration Database version`;  
```
PS > (get-spfarm).buildversion
```

10. Go to `CA > Upgrade and Migration > Check product and patch installation status` and verify the installed `Version` for each server in the farm

11. Go to `CA > Upgrade and Migration > Check Upgrade Status` and verify if all the servers in the farm shows as `Succeeded`

12. Add `WSS_Logging` database to the Availability Group if there are two SQL servers in a cluster with Always On Availability

13. Start `Search Service Application` using the following command on the Search servers in the farm;  
```
PS > Resume-SPEnterpriseSearchServiceApplication –Identity “Search Service Application”
```

14. Go to `CA > General Application Settings > Farm Search Administrator > Search Service Administration` and verify that `Administrative status` is shows as `Running`

15. Go to `CA > General Application Settings > Farm Search Administrator > Search Service Administration > Content Source` and start a `Full Crawl`

