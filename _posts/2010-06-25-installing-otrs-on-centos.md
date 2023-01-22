---
title: "Installing OTRS on CentOS"
comments: false
description: "Installing OTRS on CentOS"
keywords: "otrs, install, centos, apache, mysql"
---
> Operating System: _CentOS 5_  
> Web Server: _Apache 2.2_  
> Database: _MySQL 5.1_  

___

### A. Install OTRS

1. Download source `tar.gz` or `tar.bz2` file from [OTRS](https://www.otrs.com/) website. Unpack the archive into `/opt` directory and rename the directory from `otrs-x.x.x` to `otrs`;
```
# tar xf /tmp/otrs-x.x.x.tar.gz
# mv otrs-x.x.-x /opt/otrs
```
Alternatively, you can also install RPM build in CentOS;
```
# rpm -ivh --aid --force otrs-x.x.x-xx.noarch.rpm --nodeps
```

2. Create `otrs` user with home directory `/opt/otrs`;
```
# useradd -r -d /opt/otrs/ -c 'OTRS' otrs
# usermod -G nogroup otrs
```

3. Copy sample configuration files from source folder to OTRS folder for further operation. These source files are located at `/opt/otrs/Kernel` and `/opt/otrs/Kernel/Config` and will have the suffix `.dist`;
```
# cd otrs/Kernel/
# cp Config.pm.dist Config.pm
# cd Config
# cp GenericAgent.pm.dist GenericAgent.pm
```

4. Use the script `SetPermissions.sh` located in `/bin` of the home directory of OTRS to set access rights for the config files;
```
# /opt/otrs/bin/SetPermissions.sh /opt/otrs otrs apache nogroup apache
```
[Sample command with interchangable parameter]
```
SetPermissions.sh {Home directory of the OTRS user} {OTRS user} {Web server user} [Group of the OTRS user] [Group of the web server user]
```

___


### B. Install Perl modules

1. Use RPM build to install Perl with additional dependencies;
```
# yum -y install perl*
# rpm -ivh --aid --force perl-CGI-3.42.8el5.noarch.rpm --nodeps
# rpm -ivh --aid --force perl-PDF-API2-0.66-1.el5.rf.noarch.rpm --nodeps
# rpm -ivh --aid --force perl-SOAP-Lite-0.66a-1.2.8el4.rf.noarch.rpm --nodeps
# rpm -ivh --aid --force perl-GD-2.30-2.2el5.rf.noarch.rpm --nodeps
# rpm -ivh --aid --force perl-GD-Text-Util-0.86-1.el3.rf.noarch.rpm --nodeps
# rpm -ivh --aid --force perl-GD-Graph-1.43-0.2.el4.noarch.rpm --nodeps
```

2. Check installed modules;
```
# cd /opt/otrs/bin/
# ./otrs.checkModules
```
[Sample output]
```
CGI............................ok (v3.43)
Date::Pcalc....................ok (v1.2)
Date::Format...................ok (v2.22)
DBI............................ok (v1.607)
DBD::mysql.....................ok (v4.008)
Digest::MD5....................ok (v2.36_01)
Crypt::PasswdMD5...............ok (v1.3)
LWP::UserAgent.................ok (v5.819)
Encode::HanExtra...............ok (v0.23)
IO::Scalar.....................ok (v2.110)
IO::Wrap.......................ok (v2.110)
MIME::Base64...................ok (v3.07_01)
Mail::Internet.................ok (v2.04)
MIME::Tools....................ok (v5.427)
Net::DNS.......................ok (v0.63)
Net::POP3......................ok (v2.29)
Mail::POP3Client...............ok (v2.18 )
IO::Socket::SSL................ok (v1.18)
Net::IMAP::Simple..............ok (v1.17)
Net::IMAP::Simple::SSL.........ok (v1.3)
Net::SMTP......................ok (v2.31)
Authen::SASL...................ok (v2.12)
Net::SMTP::SSL.................ok (v1.01)
Net::LDAP......................ok (v0.39)
GD.............................ok (v2.39)
GD::Text.......................ok (v0.86)
GD::Graph......................ok (v1.44)
GD::Graph::lines...............ok (v1.15)
GD::Text::Align................ok (v1.18)
PDF::API2......................ok (v0.73)
SOAP::Lite.....................ok (v0.710.08)
XML::Parser....................ok (v2.36)
```

3. Use `perl -cw bin/cgi-bin/installer.pl`, `perl -cw bin/cgi-bin/index.pl` and `perl -cw bin/PostMaster.pl` to check for syntax error;
```
# cd /opt/otrs
# perl -cw bin/cgi-bin/installer.pl
cgi-bin/installer.pl syntax OK
# perl -cw bin/cgi-bin/index.pl
cgi-bin/installer.pl syntax OK
# perl -cw bin/PostMaster.pl
PostMaster.pl syntax OK
```

___


### C. Install Apache

1. Install Apache with the latest build;
```
# yum -y install httpd*
# /etc/init.d/httpd restart
```
Use example configuration file called in `otrs/scripts/` directory that fits for your version of OTRS for the Apache web server, named either `apache2` or `apache2-httpd-new.include.conf`. Check if both of these files have the following lines in common;
```
LoadModule cgi_module /usr/lib/apache2/modules/mod_cgi.so
```
[Sample apache2 file]
```
# agent, admin and customer frontend
ScriptAlias /otrs/ "/opt/otrs/bin/cgi-bin/"
Alias /otrs-web/ "/opt/otrs/var/httpd/htdocs/"
# if mod_perl is used
< ifmodule mod_perl.c>
# load all otrs modules
Perlrequire /opt/otrs/scripts/apache2-perl-startup.pl
# Apache::Reload - Reload Perl Modules when Changed on Disk
PerlModule Apache2::Reload
PerlInitHandler Apache2::Reload
PerlModule Apache2::RequestRec
# set mod_perl2 options
< location /otrs>
# ErrorDocument 403 /otrs/customer.pl
ErrorDocument 403 /otrs/index.pl
SetHandler perl-script
PerlResponseHandler ModPerl::Registry
Options +ExecCGI
PerlOptions +ParseHeaders
PerlOptions +SetupEnv
Order allow,deny
Allow from all
< /Location>
< /IfModule>
# directory settings
< directory "/opt/otrs/bin/cgi-bin/">
AllowOverride None
Options +ExecCGI -Includes
Order allow,deny
Allow from all
< /Directory>
< directory "/opt/otrs/var/httpd/htdocs/">
AllowOverride None
Order allow,deny
Allow from all
< /Directory>
# MaxRequestsPerChild (so no apache child will be to big!)
MaxRequestsPerChild 400
```
[Sample apache-httpd.include.conf file]
```
# agent, admin and customer frontend (mod_alias required!)
ScriptAlias /otrs/ "/opt/otrs/bin/cgi-bin/"
# if mod_perl is used
< ifmodule mod_perl.c>
# load all otrs modules (speed improvement!)
# Perlrequire /opt/otrs/scripts/apache-perl-startup.pl
# Apache::StatINC - Reload %INC files when updated on disk
# (just use it for testing, setup, ... not for high-load systems)
# PerlInitHandler Apache::StatINC
< location /otrs>
# ErrorDocument 403 /otrs/customer.pl
ErrorDocument 403 /otrs/index.pl
SetHandler perl-script
PerlHandler Apache::Registry
Options ExecCGI
PerlSendHeader On
PerlSetupEnv On
< /Location>
< /IfModule>
# MaxRequestsPerChild (so no apache child will be to big!)
MaxRequestsPerChild 400
```

2. Set hostname in `/etc/resolv.conf` for global access;
```
# vi /etc/resolv.conf
# vi /etc/hosts
# /etc/init.d/network restart
```

___


### D. Install MySQL

1. Install MySQL as backend database;
```
# yum -y install mysqld*
# service mysql restart
```

2. Create a database in MySQL for `otrs` user to grant access to OTRS system;
```
# mysql
mysql> CREATE USER 'otrs' IDETIFIED BY 'otrs';
mysql> GRANT USAGE ON *.* TO 'otrs' IDENTIFIED BY 'otrs';
WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0
MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0;
mysql> CREATE DATABASE IF NOT EXISTS 'otrs';
mysql> GRANT ALL PRIVILEGES ON 'otrs' TO 'otrs';
mysql> FLUSH PRIVILEGES;
```

___



### E. Finish Web Installation

Browse to [http://example.com/otrs/installer.pl](http://example.com/otrs/installer.pl) for post installation with web interface. Leave all parameter unchanged (e.g. root password or database name).

OTRS Agent URL: [http://example.com/otrs/index.pl](http://example.com/otrs/index.pl)  
OTRS Customer URL: [http://example.com/otrs/customer.pl](http://example.com/otrs/customer.pl)

___


**Configure High Availability for PostgreSQL Database**

If you are using PostgreSQL as backend database, the following steps will configure high availability for OTRS;

1. Assign hostname `otrs01` as primary node with IP address `192.168.1.1` to `eth0`. Assign hostname `otrs02` as secondary node with IP address `192.168.1.2` to `eth0`.  
`example.com` will be used for Apache web server to integrate with HA.<br>
Download and install the `heartbeat` package;
```
# yum install heartbeat*
```

2. Copy `/usr/share/doc/heartbeat-x.x.x` to `/etc/ha.d` directory;
```
# cp /usr/share/doc/heartbeat-x.x.x/authkeys /etc/ha.d/
# cp /usr/share/doc/heartbeat-x.x.x/ha.cf /etc/ha.d/
# cp /usr/share/doc/heartbeat-x.x.x/haresources /etc/ha.d/
```

3. Edit `authkeys` file;
```
# vi /etc/ha.d/authkeys
```
Add the following two lines;
```
auth 2
2 sha1 test-ha
```

4. Change the permission of the `authkeys` file;
```
# /etc/ha.d/
# chmod 600 /etc/ha.d/authkeys
```

5. Modify the `ha.cf` file;
```
# vi /etc/ha.d/ha.cf
```
Add the following lines;
```
logfile /var/log/ha-log
logfacility local0
keepalive 2
deadtime 30
initdead 120
bcast eth0
udpport 694
auto_failback on
node otrs01
node otrs02
```

6. Modify `haresources` file;
```
# vi /etc/ha.d/haresources
```
Add the following line:
```
otrs 01 192.168.1.100 httpd
```

7. Configure Apache for high availability;
```
# vi /etc/httpd/conf/httpd.conf
```
Add the following line in httpd.conf;
```
Listen example.com:80
```

8. Copy `/etc/httpd/conf/httpd.conf` file from `otrs01` to `otrs02`. Also copy the `/etc/ha.d/` directory from `otrs01` to `otrs02` as both needs to have the same configuration.  
Now start `heartbeat` where `otrs01` will be master and `otrs02` will work as slave.
```
# /etc/init.d/heartbeat start
```

___


**Backup OTRS**

`scripts/backup.pl` script can be used to backup OTRS configuration including application and database configuration;
```
# ./backup.pl -d /backup/
Backup /backup//2005-09-12_14-28/Config.tar.gz ... done
Backup /backup//2005-09-12_14-28/Application.tar.gz ... done
Dump MySQL rdbms ... done
Compress SQL-file... done
linux:/opt/otrs/scripts# ls /backup/2005-09-12_14-28/
Application.tar.gz Config.tar.gz DatabaseBackup.sql.gz
```

**Restore OTRS**

`scripts/restore.pl` script can be used to restore OTRS configuration including application and database configuration;
```
# ./restore.pl -b /backup/2005-09-12_14-28 -d /opt/otrs/
Restore /backup/2005-09-12_14-28//Config.tar.gz ...
Restore /backup/2005-09-12_14-28//Application.tar.gz ...
create MySQL
decompresses SQL-file ...
cat SQL-file into MySQL database
compress SQL-file...
linux:/opt/otrs/scripts#
```

**Backup-restoration policy**

A cron job handles automated backup operation which is set to take full backup of OTRS system in a folder called `backup` under root. The backup script will create three backup files called `Config.tar.gz`, `Application.tar.gz` and `Database.tar.gz`.  
To configure cron, the following command has to be executed;
```
# crontab –e
05 12 * * * /opt/otrs/scripts/backup.pl –d /backup
```

In this crontab, the backup script will take an automated backup at 12.05 every day and saved it to `/backup` folder. With a HA enabled setup, both `otrs01` and `otrs02` will provide backup process individually by themselves. In the same way, restore process for both servers will be handled manually.

___


**Sample OTRS configuration**

Here is a sample configuration after finishing the web installation;
```
SysConfig>Core>SecureMode: Yes
SysConfig>Core>ProductName: example.com
SysConfig>Core>Organization: None
SysConfig>Core>DefaultCharset: utf-8
SysConfig>Core>NotificationSenderName: Helpdesk Notification
SysConfig>Core>NotificationSenderEmail: helpdesk@example.com
SysConfig>Core>Sendmail>SendmailModule: SMTP
SysConfig>Core>Sendmail>SendmailModule::Host: smtp.example.com
SysConfig>Core>Sendmail>SendmailModule::AuthUser: otrs@example.com
SysConfig>Core>Time>TimeWorkingHours: Manually configured
SysConfig>Core>Frontend::Agent:Preferences>PreferencesGroups::SpellDict: None
SysConfig>Core>Frontend::Agent:Preferences>PreferencesGroups::Language: None
SysConfig>Core>Frontend::Agent:Preferences>PreferencesGroups::Theme: None
SysConfig>Core>Frontend::Agent:Preferences>PreferencesGroups::TimeZone: None
SysConfig>Core>Frontend::Customer>CustomerPanelLostPassword: No
SysConfig>Core>Frontend::Customer>CustomerPanelCreateAccount: No
SysConfig>Core>Frontend::Customer>CustomerPanelSubjectLostPasswordToken: Select
SysConfig>Core>Frontend::Customer>CustomerPanelBodyLostPasswordToken: Edit
SysConfig>Core>Frontend::Customer>CustomerPanelBodyLostPassword: Edit
SysConfig>Core>Frontend::Customer:Preferences>CustomerPreferencesGroups::Language: Select
SysConfig>Core>Frontend::Customer:Preferences> CustomerPreferencesGroups:::Theme: Select
SysConfig>Ticket > Core::Ticket>Ticket::NumberGenerator: Date
SysConfig>Ticket > Core::Ticket>Ticket::NumberGenerator::MinCounterSize: 3
```
