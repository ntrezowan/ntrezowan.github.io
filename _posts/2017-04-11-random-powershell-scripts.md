---
title: "Random PowerShell Scripts"
comments: false
description: "Random PowerShell Scripts"
keywords: "sharepoint, 2016, blob, cache, web application, availability, monitor, start, stop, distributed cache, os, version, architecture, hostname, domain, cname, processors, ram, disks, ip address, licensing status, uac, firewall, snmp, rdp scan, administrators, users, disk, spacec, smtp"
published: false
---
#### Find OS, OSArchitecture and Service Pack version of remote machines

```
$server= Get-Content C:\serverlist.txt
    foreach ($i in $server)
    {
    Get-WmiObject win32_operatingsystem -computer $i | Format-Table csname, caption,OSArchitecture,ServicePackMajorVersion,ProductType -AutoSize
    }
```
Sample output:
```
csname caption                  OSArchitecture ServicePackMajorVersion ProductType
------ -------                  -------------- ----------------------- -----------
HAL9   Microsoft Windows 10 Pro 64-bit                               0           1
```
Here,
ProductType 1 -> WorkStation  
ProductType 2 -> Domain Controller  
ProductType 3 -> Server

---

#### Testing if a server can send email using SMTP server
```
$cre = Get-Credential
$comp= hostname
Send-MailMessage -To you@example.com -From me@example.com -SmtpServer smtp.example.com -Credential $cre -Subject "Testing SMTP from $comp" -Body "Did you got it?"
```

---

#### Print remote machine Hostname, Device ID, Volume Name, Total Size and Free Size (in GB)
```
clear 
$cre = Get-Credential
$file = Get-Content  C:\serverlist.txt
 
foreach ($args in $file) { 
Get-WmiObject win32_logicaldisk -Credential $cre -ComputerName $args -Filter "Drivetype=3"  |  
ft SystemName,DeviceID,VolumeName,@{Label="Total Size";Expression={$_.Size / 1gb -as [int] }},@{Label="Free Size";Expression={$_.freespace / 1gb -as [int] }} -AutoSize 
}
```
Sample output:
```
SystemName DeviceID VolumeName    Total Size Free Size
---------- -------- ----------    ---------- ---------
Server1    C:                             60        22
Server1    D:       Data and Logs         60        43
Server1    F:       SysState              30        30
```

---

#### Find users in the Administrators group of remote machine
```
clear 
$cre = Get-Credential 

function Get-LocalUsers { 
    param( 
    [Parameter(Mandatory=$true,valuefrompipeline=$true)] 
    [string]$strComputer) 
    begin {} 
    Process { 
        $adminlist ="" 
        $computer = [ADSI]("WinNT://" + $strComputer + ",computer") 
        $AdminGroup = $computer.psbase.children.find("Administrators") 
        $Adminmembers= $AdminGroup.psbase.invoke("Members") | %{$_.GetType().InvokeMember("Name", 'GetProperty', $null, $_, $null)} 
        foreach ($admin in $Adminmembers) { $adminlist = $adminlist + $admin + "," } 
        $Computer = New-Object psobject 
        $computer | Add-Member noteproperty ComputerName $strComputer 
        $computer | Add-Member noteproperty Administrators $adminlist 
        Write-Output $computer
        } 
end {} 
} 
Get-Content C:\serverlist.txt | Get-LocalUsers | Export-Csv C:\server-admin.csv
```
This script will create a `server-admin.csv` file with two columns (ComputerName:Administrators)

---

#### Check if RDP is running in remote machine
```
param(
     [parameter(Mandatory=$true,ValueFromPipeline=$true)][string[]]$Computer
     )
$results = @()
foreach($name in $Computer){
        $result = "" | select Name,RDP
        $result.name = $name
        try{
           $socket = New-Object Net.Sockets.TcpClient($name, 3389)
           if($socket -eq $null){
                 $result.RDP = $false
           }else{
                 $result.RDP = $true
                 $socket.close()
           }
        }
        catch{
                 $result.RDP = $false
        }
        $results += $result
}
return $results
```
Sample output:
```
Computer[0]: Server1
Computer[1]: 

Name        RDP
----        ---
Server1     True
```
If it returns `TRUE`, then default RDP port `3389` is open to accept connection.

---

#### Find OS version, OS Architecture, Hostname, Domain, CNAME, # of Processors, RAM, Disks, IP address, Windows Licensing Status, UAC Status, Firewall Setting, SNMP Install Status and will check if the machine is physical or virtual
```
CLS
    
Write-Host ""
Write-Host "OS Version: "
Write-Host "-----------"
Get-CimInstance Win32_OperatingSystem | Select-Object  Caption | ForEach{ $_.Caption }
Write-Host ""
Write-Host ""

Write-Host "OS Architecture: "
Write-Host "----------------"
Get-CimInstance Win32_OperatingSystem | Select-Object  OSArchitecture | ForEach{ $_.OSArchitecture }
Write-Host ""
Write-Host ""

Write-Host "Hostname: "
Write-Host "---------"
Get-CimInstance Win32_OperatingSystem | Select-Object  CSName | ForEach{ $_.CSName }
Write-Host ""
Write-Host ""

Write-Host "Domain Name: "
Write-Host "------------"
Get-CimInstance Win32_ComputerSystem | Select-Object Domain | ForEach{ $_.Domain }
Write-Host ""
Write-Host ""

Write-Host "CNAME: "
Write-Host "------"
[System.Net.Dns]::GetHostByName(($env:computerName)) | FL HostName | Out-String | %{ "{0}" -f $_.Split(':')[1].Trim() };
Write-Host ""
Write-Host ""

Write-Host "Number of Processors: "
Write-Host "---------------------"
Get-CimInstance Win32_ComputerSystem -ComputerName localhost | Select-Object NumberOfLogicalProcessors | ForEach{ $_.NumberOfLogicalProcessors}
Write-Host ""
Write-Host ""

Write-Host "RAM (in GB): "
Write-Host "------------"
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum | Foreach {"{0:N2}" -f ([math]::round(($_.Sum / 1GB),2))}
Write-Host ""
Write-Host ""

Write-Host "Disk Spaces (in GB):"
Write-Host "--------------------"
Write-Host ""
Get-CimInstance win32_logicaldisk | where caption -eq "C:" | foreach-object {write "$($_.caption) $('{0:N2}' -f ($_.Size/1gb)) GB total, $('{0:N2}' -f ($_.FreeSpace/1gb)) GB free "}
Get-CimInstance win32_logicaldisk | where caption -eq "D:" | foreach-object {write "$($_.caption) $('{0:N2}' -f ($_.Size/1gb)) GB total, $('{0:N2}' -f ($_.FreeSpace/1gb)) GB free "}
Get-CimInstance win32_logicaldisk | where caption -eq "E:" | foreach-object {write "$($_.caption) $('{0:N2}' -f ($_.Size/1gb)) GB total, $('{0:N2}' -f ($_.FreeSpace/1gb)) GB free "}
Get-CimInstance win32_logicaldisk | where caption -eq "F:" | foreach-object {write "$($_.caption) $('{0:N2}' -f ($_.Size/1gb)) GB total, $('{0:N2}' -f ($_.FreeSpace/1gb)) GB free "}
Get-CimInstance win32_logicaldisk | where caption -eq "G:" | foreach-object {write "$($_.caption) $('{0:N2}' -f ($_.Size/1gb)) GB total, $('{0:N2}' -f ($_.FreeSpace/1gb)) GB free "}
Write-Host ""
Write-Host ""

Write-Host "Physical or Virtual:"
Write-Host "--------------------"
Get-WmiObject win32_computersystem | ForEach{ $_.model}
Write-Host ""
Write-Host ""

Write-Host "IP Address: "
Write-Host "-----------"
Get-NetIPConfiguration
Write-Host ""
Write-Host ""

Write-Host "Windows Licensing Status: "
Write-Host "------------------------"
Get-CimInstance -ClassName SoftwareLicensingProduct | where PartialProductKey | select LicenseStatus | ForEach{ $_.LicenseStatus}
Write-Host ""
Write-Host "[1 = License activated; 0 = License not activated]"
Write-Host ""
Write-Host ""

Write-Host "UAC Status: "
Write-Host "-----------"
(Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System).EnableLUA 
Write-Host ""
Write-Host "[1 = UAC Active; 0 = UAC not active]"
Write-Host ""
Write-Host ""

Write-Host "Firewall Setting: "
Write-Host "-----------------"
netsh advfirewall show domain state
Write-Host ""
Write-Host ""

Write-Host "SNMP Install Status: "
Write-Host "-------------------"
$srv=Get-WindowsFeature *snmp-service*
$srv.Installed
Write-Host ""
Write-Host ""

PAUSE
```
Sample output:
```
OS Version: 
-----------
Microsoft Windows Server 2012 R2 Datacenter


OS Architecture: 
----------------
64-bit


Hostname: 
---------
Server1


Domain Name: 
------------
dc.example.com


CNAME: 
------
Server1.dc.example.com


Number of Processors: 
---------------------
8


RAM (in GB): 
------------
12.00


Disk Spaces (in GB):
--------------------

C: 79.66 GB total, 43.38 GB free 
D: 80.00 GB total, 64.17 GB free 


Physical or Virtual:
--------------------
VMware Virtual Platform


IP Address: 
-----------


InterfaceAlias       : HSMV-VL-2708
InterfaceIndex       : 12
InterfaceDescription : vmxnet3 Ethernet Adapter
NetProfile.Name      : example.com
IPv4Address          : 10.10.10.2
IPv4DefaultGateway   : 10.10.10.1
DNSServer            : 10.10.1.1
                       10.10.1.2



Windows Licensing Status: 
------------------------
1

[1 = License activated; 0 = License not activated]


UAC Status: 
-----------
0

[1 = UAC Active; 0 = UAC not active]


Firewall Setting: 
-----------------

Domain Profile Settings: 
----------------------------------------------------------------------
State                                 OFF
Ok.



SNMP Install Status: 
-------------------
True


Press Enter to continue...: 
```

---

#### Start/Stop Distributed Cache in SharePoint 2016
To stop distributed cache, run the following script in `SharePoint 2016 Management Shell`;
```
$instanceName ="SPDistributedCacheService Name=AppFabricCachingService"
$serviceInstance = Get-SPServiceInstance | ? {($_.service.tostring()) -eq $instanceName -and ($_.server.name) -eq $env:computername}
$serviceInstance.Unprovision()
```
To start distributed cache, run the following script in `SharePoint 2016 Management Shell`;
```
$instanceName ="SPDistributedCacheService Name=AppFabricCachingService"
$serviceInstance = Get-SPServiceInstance | ? {($_.service.tostring()) -eq $instanceName -and ($_.server.name) -eq $env:computername}
$serviceInstance.Provision()
```

---

#### Monitor SharePoint 2016 Web Application availability
This script will check the URL of each web application and will send an email if there is any issue;
```
function sendMail($site){
$smtpServer = "smtp.example.com"
 
$msg = new-object Net.Mail.MailMessage
$smtp = new-object Net.Mail.SmtpClient($smtpServer)
 
$msg.From = "sharepoint@example.com"
$msg.ReplyTo = "sharepoint@example.com"
$msg.To.Add("me@example.com")
$msg.Priority = [System.Net.Mail.MailPriority]::High
$msg.subject = "ALERT: "+$site+" IS UNAVAILABLE"
$msg.body = "SharePoint Web Application $site is unavailable."
 
#Sending email
$smtp.Send($msg)
}
 
function checkIfSiteUp($url){
$webclient = new-object System.Net.WebClient
$webClient.UseDefaultCredentials = $true

try {
$page = $webclient.DownloadString($url)
$errorPage = $page.Contains("Troubleshoot issues with Microsoft SharePoint Foundation.")
$serverError = $page.Contains("Server Error")
$configDBOffline = $page.Contains("Cannot connect to the configuration database.")
$readOnly = $page.Contains("We apologize for any inconvenience, but we've made the site read only while we're making some improvements.")
if ($errorPage -or $serverError -or $configDBOffline -or $readOnly) {
sendMail($url)
}
}
catch {
sendMail($url)
}
}
 
$shptWebs = @("http://WebApplication1",
"http://WebApplication2",
"https://WebApplication3")
 
foreach ($web in $shptWebs)
{
checkIfSiteUp($web)
}
```
This script can be scheduled in Task Scheduler to run in every 5/10/15 minutes depending on the requirement.

---

#### Flush BLOB cache of Web Application in SharePoint 2016
Run this script in `SharePoint 2016 Management Shell` to clear BLOB cache;
```
$webApp = Get-SPWebApplication "http://WebApplication1"
[Microsoft.SharePoint.Publishing.PublishingCache]::FlushBlobCache($webApp)
Write-Host "Flushed the BLOB cache for:" $webApp
```

---
