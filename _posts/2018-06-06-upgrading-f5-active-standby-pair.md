---
title: "Upgrading F5 Active-Standby Pair"
comments: false
description: "Upgrading F5 Active-Standby Pair"
keywords: "f5, active, standby, pair upgrade, ha, high availability"
published: true
---
### Environment
F5 Active Server = f51.example.com  
F5 Standby Server = f52.example.com


---
### A. Preparation before upgrade (applied to both active/standby)
1. Check current software version of F5;  
Run the following;
```
# tmsh show /sys software status  
--------------------------------------------------
Sys::Software Status
Volume  Product   Version  Build  Active    Status
--------------------------------------------------
HD1.1    BIG-IP  12.1.3.4  0.0.2      no  complete
HD1.2    BIG-IP  13.1.0.7  0.0.1      no  complete
HD1.3    BIG-IP  13.1.1.3  0.0.1      yes complete
```
From the output, look for the partition which is Active and then you will find the `Version`. Here the version is `13.1.1.3`.
2. Verify license and renew if necessary;  
BIG-IP license is stored at `/config/bigip.license` and it has two dates; `Licensed date` and `Service check date`.<br /><br />
`Licensed date` will show the date when you used your Registration Key for the first time to license your BIG-IP system. To find `Licensed date`, run the following;
```
# grep "Licensed date" /config/bigip.license
Licensed date :                    20180601
```
`Service Check Date` is the date when you last reactivated your license and it gets updated every time you reactivate your license (assuming that there is an active service contract with F5 for this BIG-IP system). For example, if you have reactivate your license on June 30, 2018 then it will show as 20180630. To find `Service Check Date`, run the following;
```
# grep "Service check date" /config/bigip.license
Service check date :               20171013
```
There is another interesting date called `License Check Date` and this date is related with the software version of BIG-IP. For example, Version `12.1.0-12.1.3` has a `License Check Date` 2016-03-2018. The `License Check Date` enforcement is applied during system startup. The system compares the `License Check Date` with the `Service Check Date` exists in the license file. If the `Service Check Date` is earlier than the `License Check Date`, the system will initialize but will not load the configuration. To allow the configuration to load properly, you must update the `Service Check Date` in the `bigip.license` file by reactivating the system's license. To find the `License Check Date` for the version you planned to upgrade, visit https://support.f5.com/csp/article/K7727. For example, if you plan to upgrade to version `13.1.0-13.1.1`, then `License Check Date` is 20170912.<br /><br />
Now by comparing `Service check date` with `License Check Date`, we see that 20171013 > 20170912 which means you do not need to reactive the license before upgrade. But it is always a good practice to reactivate your license everytime you upgrade the F5 because it extends your `Service check date` in the license file.<br /><br />
If `Service Check Date` < `License Check Date`, do the following to reactivate the license before upgrade;  
    a) Log in to the Configuration utility  
    b) Navigate to System > License > Reactivate  
    c) Select either Automatic (if F5 can reach internet) or Manual (if F5 cannot reach internet)  
    d) Click Next and it will be reactivated  

3. Check device certificate and renew if necessary;  
To check the device certificate, do the following;  
    a) Log in to the Configuration utility  
    b) Navigate to System > Certificate Management > Device Certificate Management > Device Certificate<br /><br />
If you need to renew device certificate, do the following;  
    a) Log in to the Configuration utility  
    b) Navigate to System > Certificate Management > Device Certificate Management > Device Certificate  
    c) Click Import and choose Certificate and Key as Import Type  
    d) Choose both certificate and key  
    e) Click Import  
    
4. Do a ConfigSync to sync configuration on both units;  
It is always a better to do a config sync before the upgrade and this way both units will have the latest configuration.<br /><br />
To do a config sync, do the following;  
    a) Log in to the Configuration utility  
    b) Navigate to Device Management > Overview  
    c) For Device Groups, click the name of the device group (device-group-a-failover) you want to synchronize  
    d) For Devices, click the name of the device from which you want to perform the synchronization action  
    e) For Sync, click the appropriate synchronization action  
    f) Click Sync  
  
5. Generate a qkview and check for Upgrade Advisor in iHealth;  
iHealth reports can be used to find if there is any issue if we upgrade F5 units from one version to another. To generate a qkview, do the following;  
    a) Log in to the Configuration utility  
    b) Navigate to System > Support  
    c) Click New Support Snapshot  
    d) For Health Utility, click Generate QKView  
    e) Click Start  
    f) To download the output file, click Download<br /><br />
After download the file from F5, upload it to https://ihealth.f5.com/ and then go to `Upgrade Advisor` and select the version to which you want to upgrade your units. Then check the recommended feedback.<br /><br />
For example, here is one advise that iHealth provided when we are upgrading from `12.1.3.4` to `13.1.1.3`;  
TMOS vulnerability: Password changes for local users may not be preserved unless the configuration is explicitly saved (K37250780).  

6. Create a backup of the config file;  
It is always good to have a backup of the config file before upgrade. This way, we can quickly restore F5 to previous stable state if there is any issues during upgrade.<br /><br />
To create UCS file, do the following;
    a) Log in to the Configuration utility  
    b) Navigate to System > Archives  
    c) To initiate the process of creating a new UCS archive, click Create  
    d) In the File Name box, type a name for the file  
    e) To create the UCS archive file, click Finished  
    f) When the system completes the backup process, examine the status page for any reported errors before proceeding to the next step  
    g) To return to the Archive List page, click OK  
    h) Copy the .ucs file to a secure file system (i.e. to a shared NFS)

7. Verify volume formatting scheme;  
Run the following to check if Big-IP system is using volume formatting system or partition formatting system;
```
# lvscan
  ACTIVE            '/dev/vg-db-sda/dat.maint.1' [300.00 MiB] inherit
  ACTIVE            '/dev/vg-db-sda/dat.share.1' [20.00 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/dat.log.1' [500.00 MiB] inherit
  ACTIVE            '/dev/vg-db-sda/dat.swapvol.1' [1000.00 MiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.1.root' [440.00 MiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.1._usr' [3.29 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.1._config' [3.17 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.1._var' [3.00 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.2.root' [440.00 MiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.2._usr' [4.01 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.2._config' [3.17 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.2._var' [3.00 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/app.ASWADB.set.2.mysqldb' [12.00 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/app.avr.dat.avrdata' [3.81 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/app.afm.dat.afmdata' [3.81 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/app.asm.dat.asmdata1' [4.05 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.3.root' [440.00 MiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.3._usr' [4.01 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.3._config' [3.17 GiB] inherit
  ACTIVE            '/dev/vg-db-sda/set.3._var' [3.00 GiB] inherit
```
If it returns no volume scheme, then it means Big-IP is using partition formatting scheme.  

8. Import the software/hotfix image;  
To import a software/hotfix image, do the following;  
    a) Log in to the Configuration utility with administrative privileges  
    b) To upload the necessary ISO files, navigate to System > Software Management  
    c) Click Import  
    d) Click Browse to select the SIG file (BIGIP-xx.xxx.iso.xxx.sig). This is a SHA384 signed digest  
    e) Click Import again  
    f) Click Browse to select the ISO file (BIGIP-xx.x.x.x.x.xxxx.iso)  
    g) Click Import  
    h) Click Import again  
    i) Click Browse to select the pem file (archive.pubkey.xxxxxxxxx.pem). Download 3072 bit one since the SIG is using 3072 bit RSA public key  
    j) Click Import  
    k) After uploading the image, it will be listed under software image list  
    l) Verify that all the files are under /shared/images;  
```
ls -ltr /shared/images
total 7048744
-rw-r--r--. 1 tomcat tomcat 1938057216 2018-06-15 10:30 BIGIP-13.1.0.7-0.0.1.iso
-rw-r--r--. 1 tomcat tomcat 2009556992 2018-06-15 13:01 BIGIP-12.1.3.4-0.0.2.iso
-rw-r--r--. 1 tomcat tomcat 2057873408 2019-01-15 11:18 BIGIP-13.1.1.3-0.0.1.iso
-rw-r--r--. 1 tomcat tomcat        384 2019-01-15 11:23 BIGIP-13.1.1.3-0.0.1.iso.384.sig
-rw-r--r--. 1 tomcat tomcat        625 2019-01-15 11:28 archive.pubkey.20160210.pem
```
    m) Verify the SIG;  
```
# openssl dgst -sha384 -verify /shared/images/archive.pubkey.20160210.pem -signature /shared/images/BIGIP-13.1.1.3-0.0.1.iso.384.sig /shared/images/BIGIP-13.1.1.3-0.0.1.iso
Verified OK
```
9. Verify root login to shell is possible;  
In situation during the upgrade, F5 might not be able to access ADFS/LDAP and so your user/pass might not work. Check if you have a root account and if you can SSH to it by running the following;
```
ssh root@f51.example.com
ssh root@f52.example.com
```

10. Verify admin login to GUI is possible;  
In situation during the upgrade, F5 might not be able to access ADFS/LDAP and so your user/pass might not work. Check if you have a admin account and if you can login to GUI using the admin account;
```
https://f51.example.com
https://f52.example.com
```

---

### B. Check running configuration (applied to both active/standby) and disable Auto-Failback
1. Check running configuration integrity;  
If there is an issue in the running configuration, then it will give error when F5 reboots first time after the upgrade. Check if there is any error in the configuration file by running the following command;
```
# tmsh load /sys config verify
Validating system configuration...
  /defaults/asm_base.conf
  /defaults/config_base.conf
  /defaults/ipfix_ie_base.conf
  /defaults/ipfix_ie_f5base.conf
  /defaults/low_profile_base.conf
  /defaults/low_security_base.conf
  /defaults/policy_base.conf
  /defaults/wam_base.conf
  /defaults/analytics_base.conf
  /defaults/apm_base.conf
  /defaults/apm_saml_base.conf
  /defaults/app_template_base.conf
  /defaults/classification_base.conf
  /var/libdata/dpi/conf/classification_update.conf
  /defaults/urlcat_base.conf
  /defaults/daemon.conf
  /defaults/pem_base.conf
  /defaults/profile_base.conf
  /defaults/sandbox_base.conf
  /defaults/security_base.conf
  /defaults/urldb_base.conf
  /usr/share/monitors/base_monitors.conf
Validating configuration...
  /config/bigip_base.conf
  /config/bigip_user.conf
  /config/bigip.conf
  /config/bigip_script.conf
  /config/partitions/Sandbox/bigip.conf
There were warnings:
SSLv2 is no longer supported and has been removed. The 'sslv2' keyword in the cipher string of the ssl profile (/Common/clientssl-test) has been ignored.
SSLv2 is no longer supported and has been removed. The 'sslv2' keyword in the cipher string of the ssl profile (/Common/serverssl-test) has been ignored.
```
Fix the issues before you go forward with upgrading F5. `WARNING` can be ignored but not suggested.

2. Turn off Auto-Failback;  
To turn off Auto-Failback on both F5 before upgrade to prevent active-active condition, do the following in v13 or above;  
    a) On the Main menu, Click Device Management > Traffic Group > traffic-group-1  
    b) Uncheck "Always Failback to First Device if it is Available"  
    c) Click Save  
    d) Do a config sync<br /><br />
Do the following to turn off Auto-Failback in v12 or below;  
    a) On the Main menu, Click Device Management > Traffic Groups  
    b) Select traffic-group-1  
    c) Select Advanced from Configuration  
    d) Uncheck Auto Failover  
    e) Click Update  
  
---

### C. Open a proactive service request with F5 Technical Support
Proactive service requests provide F5 Technical Support advance notice of your maintenance window to save time in case a problem arises that requires F5 Technical Support assistance. Here is more on this;
https://support.f5.com/csp/article/K16022

---

---DO-NOT-CONFIG-SYNC-UNTIL-SECTION-D-IS-COMPLETED---

### D. Upgrading the units

#### Upgrade F52.example.com (standby unit first)
1. Force `F52` to offline state;  
    a) On the Main menu, click Device Management > Devices  
    b) Click the name of `F52`  
    c) Click Force Offline  
    d) `F52` changes to offline state<br /><br />
Once `F52` changes to offline state, ensure that traffic passes normally for all active traffic groups on the other devices. 

2. Restart mcpd and then reboot. This will force F5 to recompile the configuration and load it into memory;
```
# touch /service/mcpd/forceload
# reboot
```
Check logs to see if there is any `ERROR` or `WARNING`;
```
# tail -f/var/log/liveinstall.log
# tail -f /var/log/ltm | egrep “err|warn”
# egrep 'err|warn' /var/log/ltm
```
3. Install the new version software;  
    a) Log in to the Configuration utility with administrative privileges  
    b) Navigate to System > Software Management > Image List  
    c) Select the Software Image and click Install. A new window will pop up called Install Software Image  
    d) Select an available disk from the Select Disk menu. Here HD1 is an LVM disk  
    e) Select an empty volume set from the Volume Set Name menu, or type a new volume set name. Volumes are named as HD1.1, HD1.2, HD1.3 etc, so to create a new volume, type “3” and it will create HD1.3 and install the image there  
    f) Click Install  
    g) To see the installation progress, view the Install Status column of the Installed Images section of the page  

4. Reboot to the newly upgraded software volume;  
    a) Log in to the Configuration utility with administrative privileges  
    b) Navigate to System > Software Management > Boot Locations  
    c) If you select Install Configuration to Yes, it will ask from where you want to copy the configuration from. Choose the latest one. If there have been no changes since you performed the upgrade and /or make any changes in the configuration and syncs, you do not need to set the Install Configuration option to Yes when activating the new volume. But if you make any changes, it’s better to select Yes when activating the new volume  
    d) Click the boot location containing the newly upgraded software volume  
    e) To restart the system to the specified boot location, click Activate  
    f) To close the confirmation message, click OK. At this point, BIG-IP will reboots automatically

5. Check which boot location is loaded after reboot;  
```
# watch tmsh show sys software
```
6. Check if installation fails;  
```
# tail -f/var/log/liveinstall.log
```
7. Check LTM logs;  
```
# tail -f /var/log/ltm
```
8. Check `F52` version after reboot;  
    a) Go to System > Configuration > Device > General  
    b) Check the version  

9. Bring `F52` to Standby state;  
    a) Release Device `F52` from offline state  
    b) On the Main menu, click Device Management > Devices  
    c) Click the name of Device `F52`  
    d) Click Release Offline  
    e) `F52` changes to standby state<br /><br />
The new version of BIG-IP software is installed on `F52`, with all traffic groups in standby state.

#### Make F52.example.com the active load balancer
 	
1. Force `F51` to standby state;  
    a) Login to `F51`  
    b) On the Main menu, click Device Management > Devices  
    c) Click the name of `F51`  
    d) Click Force to Standby  
    e) `F51` changes to standby state<br /><br />
Once `F51` changes to offline state, ensure that traffic passes normally for all active traffic groups on `F52`.  

2. Verify that `F52` is the active load balancer  

3. Verify expected objects appear in the shared and non-shared portions of the configuration;  
    a) To verify that the expected objects appear in the shared and non-shared portions of the configuration, navigate to Local Traffic > Pools  
Confirm that the expected objects are present and compare with `F51`  
    b) Navigate to Network > VLANs  
Confirm that the expected objects are present and compare with `F51`  
    c) Go to iApps, open a VIP and go to Reconfigure to see if everything is loading properly  
    
4. Check the most recent logs (/var/log/ltm for example) for obvious signs of issues like repeating messages. Comparing logs to the active unit or to the logs prior to the upgrade can be helpful  

5. Check SSL with SSLLabs  

6. Generate a qkview and review it in the iHealth Diagnostics section for currently known issues  

7. Contact teams to begin application testing. If testing successes, processed with upgrading `F51`. Otherwise check “Backing out software upgrade” section  

#### Upgrade F51.example.com  

1. Force `F51` to offline state;  
    a) On the Main menu, click Device Management > Devices  
    b) Click the name of `F51`  
    c) Click Force Offline  
    d) `F51` changes to offline state<br /><br />
Once `F51` changes to offline state, ensure that traffic passes normally for all active traffic groups on the other devices. 

2. Restart mcpd and then reboot. This will force F5 to recompile the configuration and load it into memory;
```
# touch /service/mcpd/forceload
# reboot
```
Check logs to see if there is any `ERROR` or `WARNING`;
```
# tail -f/var/log/liveinstall.log
# tail -f /var/log/ltm | egrep “err|warn”
# egrep 'err|warn' /var/log/ltm
```
3. Install the new version software;  
    a) Log in to the Configuration utility with administrative privileges  
    b) Navigate to System > Software Management > Image List  
    c) Select the Software Image and click Install. A new window will pop up called Install Software Image  
    d) Select an available disk from the Select Disk menu. Here HD1 is an LVM disk  
    e) Select an empty volume set from the Volume Set Name menu, or type a new volume set name. Volumes are named as HD1.1, HD1.2, HD1.3 etc, so to create a new volume, type “3” and it will create HD1.3 and install the image there  
    f) Click Install  
    g) To see the installation progress, view the Install Status column of the Installed Images section of the page  

4. Reboot to the newly upgraded software volume;  
    a) Log in to the Configuration utility with administrative privileges  
    b) Navigate to System > Software Management > Boot Locations  
    c) If you select Install Configuration to Yes, it will ask from where you want to copy the configuration from. Choose the latest one. If there have been no changes since you performed the upgrade and /or make any changes in the configuration and syncs, you do not need to set the Install Configuration option to Yes when activating the new volume. But if you make any changes, it’s better to select Yes when activating the new volume  
    d) Click the boot location containing the newly upgraded software volume  
    e) To restart the system to the specified boot location, click Activate  
    f) To close the confirmation message, click OK. At this point, BIG-IP will reboots automatically

5. Check which boot location is loaded after reboot;  
```
# watch tmsh show sys software
```
6. Check if installation fails;  
```
# tail -f/var/log/liveinstall.log
```
7. Check LTM logs;  
```
# tail -f /var/log/ltm
```
8. Check `F51` version after reboot;  
    a) Go to System > Configuration > Device > General  
    b) Check the version  

9. Bring `F51` to Standby state;  
    a) Release Device `F51` from offline state  
    b) On the Main menu, click Device Management > Devices  
    c) Click the name of Device `F51`  
    d) Click Release Offline  
    e) `F51` changes to standby state<br /><br />
The new version of BIG-IP software is installed on `F51`, with all traffic groups in standby state.

#### Make F51.example.com the active load balancer
 	
1. Force `F52` to standby state;  
    a) Login to `F52`  
    b) On the Main menu, click Device Management > Devices  
    c) Click the name of `F52`  
    d) Click Force to Standby  
    e) `F52` changes to standby state<br /><br />
Once `F52` changes to offline state, ensure that traffic passes normally for all active traffic groups on `F51`.  

2. Verify that `F51` is the active load balancer  

3. Verify expected objects appear in the shared and non-shared portions of the configuration;  
    a) To verify that the expected objects appear in the shared and non-shared portions of the configuration, navigate to Local Traffic > Pools  
Confirm that the expected objects are present and compare with `F52`  
    b) Navigate to Network > VLANs  
Confirm that the expected objects are present and compare with `F52`  
    c) Go to iApps, open a VIP and go to Reconfigure to see if everything is loading properly  
    
4. Check the most recent logs (/var/log/ltm for example) for obvious signs of issues like repeating messages. Comparing logs to the active unit or to the logs prior to the upgrade can be helpful  

5. Check SSL with SSLLabs  

6. Generate a qkview and review it in the iHealth Diagnostics section for currently known issues  

7. Contact teams to begin application testing 

---

---CONFIG-SYNC-IS-ALLOWED---

### E. Sync config and enable Auto-Failback

1. Do a config sync;  
Sync the configuration from `F51` to `F52`;
  a) Log in to the Configuration utility  
  b) Navigate to Device Management > Overview  
  c) For Device Groups, click the name of the device group (device-group-a-failover or datasync-global-dg) you want to synchronize  
  d) For Devices, click the name of the device from which you want to perform the synchronization action  
  e) For Sync, click the appropriate synchronization action  
  f) Click Sync  

2. Enable Auto-failback;  
Do the following to disable Network failover;  
  a) On the Main menu, Click Device Management > Device Groups  
  b) Select device-group-a-failover  
  c) Select Advanced from Configuration  
  d) Uncheck Network Failover  
  e) Click Update  

---

### Backing out software upgrade

1. Gathering troubleshooting information;

    a) To determine what may be causing the configuration load error, run the following;
```
# load /sys config verify
```
    b) Create a qkview file

2. If you can access Configuration Utility, boot to previous software version;  
    a) Log in to the Configuration utility with administrative privileges  
    b) Navigate to System > Software Management > Boot Locations  
    c) Click the Boot Location for the previous software version  
    d) Click Activate  
    e) To close the confirmation message, click OK. At this point, BIG-IP will reboots automatically  

3. If you cannot access Configuration Utility, run the following from command line to boot to previous software version;

    a) Log in to the command line  
    b) Find the volume name by running the following;
```
# tmsh show /sys software status  
--------------------------------------------------
Sys::Software Status
Volume  Product   Version  Build  Active    Status
--------------------------------------------------
HD1.1    BIG-IP  12.1.3.4  0.0.2      no  complete
HD1.2    BIG-IP  13.1.0.7  0.0.1      no  complete
HD1.3    BIG-IP  13.1.1.3  0.0.1      yes complete
```
    c) To reboot to a different HDD, run the following;
```
tmsh reboot volume HD1.3
```

### Copying configuration from one boot location to another

1. Log in to the BIG-IP command line   
2. Display the available boot locations by running the following;
```
# tmsh show /sys software status  
--------------------------------------------------
Sys::Software Status
Volume  Product   Version  Build  Active    Status
--------------------------------------------------
HD1.1    BIG-IP  12.1.3.4  0.0.2      no  complete
HD1.2    BIG-IP  13.1.0.7  0.0.1      no  complete
HD1.3    BIG-IP  13.1.1.3  0.0.1      yes complete
```
3. Copy the configuration from the source boot location to the target boot location using the following;
```
# cpcfg --source=HD1.2 HD1.3
```
This command will copy the configuration from boot location `HD1.2` to boot location `HD1.3`

4. To copy a configuration from one boot location to another and rebooting to the specific target boot location, run the following;
```
# cpcfg --source=HD1.2 --reboot HD1.3
```
This command will copy the configuration from boot location `HD1.2` to `HD1.3` and immediately reboot the system to the `HD1.3` boot location.


### Upgrade Consideration

* Software images can be installed to any software volume except the running volume. This behavior ensures the running software volume is available should a need arise to revert to the prior Big-IP version and configuration.
 
* It is recommended to install the Big-IP update to an empty software volume to avoid potential confusion should the configuration fail to push to the new software volume.
 
* By default, the current running configuration is pushed to the new software volume automatically.
 
* The 'Install Configuration' option in the Configuration Utility can be used to update the target software volume prior to booting/activating the volume if time has elapsed since the software was installed and some of the Big-IP configuration has changed in the interim. This is generally unnecessary if you install the software and immediately boot into it.  
https://support.f5.com/csp/article/K14704
 
* For a Big-IP instance, multiple Big-IP software installations can exist on disk. Use the `tmsh show sys software`command to view all software volumes. You can install directly over an existing software volume and the target volume will be overwritten. In order to delete a software volume, you can use the Configuration Utility or tmsh. Software installation can be performed via the Configuration Utility or tmsh.  
https://support.f5.com/csp/article/K34745165  
 
* When a Hotfix ISO file is installed, two installations will happen in the background; the first will install the Final (larger) ISO and the second will install the Hotfix ISO. In the GUI, you will see two progress bars progress from 0-100%.
 
* The first boot of the new Big-IP software volume will take extra time, compared to a regular reboot, in order to decompress packages and to import the running configuration for the first time. Installation progress can be monitored via the serial console port or via the vconsole command in the case of vCMP Guest upgrades.  
https://support.f5.com/csp/article/K15372
 
* High Availability (HA) communication via network failover will function between major software branches but is only supported for the duration of the upgrade process. For example, a pair of Big-IPs running 11.5.3 and 12.1.1 can negotiate Active/Standby status via network failover.  
https://support.f5.com/csp/article/K8665
 
* Configsync will not operate between different major software branches. For example, you cannot synchronize configurations from a unit running 11.5.3 unit to a unit running 11.5.4; you must wait for both units to be upgraded until configsync will operate.  
https://support.f5.com/csp/article/K13946

* It is possible to upgrade an unit with a blank configuration.  
https://support.f5.com/csp/article/K13438
 
* As an alternative method to install the desired software version, prepared USB media can be used to reinitialize the disk and Big-IP software to factory defaults. Once complete, a previously saved UCS archive can be loaded to restore configuration. This method will wipe all data on the system.  
https://support.f5.com/csp/article/K13132   
https://support.f5.com/csp/article/K13117  
 
* Big-IP 10.x can be upgraded to any version of 11.x given your hardware supports the new version. Big-IP 11.x can be upgraded to any version of 12.x given your hardware supports the new version. You cannot upgrade directly from 10.x to 12.x.   
https://support.f5.com/csp/article/K13845    
https://support.f5.com/csp/article/K9476

* The Latest Maintenance Release of each Long-Term Stability Release are the best choices for security and sustainability. The lowest-numbered version in the Latest Maintenance Release column is generally considered the most stable while the highest number contains the newest features and security fixes.  
https://support.f5.com/csp/article/K5903
