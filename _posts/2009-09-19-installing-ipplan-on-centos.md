---
title: "Installing IPplan on CentOS"
comments: false
description: "Installing IPplan on CentOS"
keywords: "ipplan, install, centos, apache, mysql"
---
> Operating System: _CentOS 5_  
> Web Server: _Apache 2.2_  
> Database: _MySQL 5.1_  

___

1. Download [ipplanx.xx](http://iptrack.sourceforge.net/) and extract at `/var/www/html`;
```
# cd /var/www/html
# tar zxvf ipplan-x.xx.tar.gz
```

2. Change ownership and permissions of IPplan directory;
```
# chown -R root:apache /var/www/html/ipplan/
# chmod -R 750 /var/www/html/ipplan/
```

3. Create a database `ipplan`;
```
# mysqladmin -u root -p create ipplan
```

4. Create an user `ipplan` for the database `ipplan`;
```
# mysql -u root -p ipplan
```

5. Give `ipplan` user permission to `ipplan` database;
```
mysql> GRANT SELECT,INSERT,UPDATE,DELETE on ipplan.* \ TO ipplan@example.com IDENTIFIED by ‘blink182’;
mysql> flush privileges;
mysql> exit
```

6. Change IPplan `config.php` file and modify database connection settings:
```
define("DBF_TYPE", 'maxsql');
define("DBF_HOST", 'example.com');
define("DBF_USER", 'ipplan');
define("DBF_NAME", 'ipplan');
define("DBF_PASSWORD", 'blink182');
```

7. Install `Nmap` and `SNMP` for IPplan poller;
```
# yum -y install nmap
# yum -y install snmpd
```

8. IPplan poller uses a flat file to know which IP addresses the scan. Create a text file, `example.txt` and list all the networks you want to scan;
```
172.16.0.0/16
192.168.0.0/24
```

9. Set a cron job for IPplan poller to configure polling interval;
```
# crontab -e
```
Add the following in crontab;
```
0 9,12,15 * * * php /var/www/html/ipplan/contrib/ipplan-poller.php - hostname -c 1 -f /var/www/html/ipplan/example.txt
```

10. Configure `snmpd.conf`;
```
# vi /etc/snmp/snmpd.conf
```
The following lines should be included in `snmpd.conf` file;
```
com2sec local localhost public
group MyRWGroup v1 local
group MyRWGroup v2c local
group MYRWGroup usm local
view all include .1 80
access MYRWGroup "" any noauth exact all all none
syslocation Unknown
syscontact admin@example.com
pass .1.3.6.1.4.1.4413.4.1 /usr/bin/ucd5820stat
```

11. Restart MySQL, Apache and SNMP daemon;
```
# service httpd restart
# service mysqld restart
# service snmpd restart
```

___

Browse to [http://example.com/ipplan/admin/install.php](http://example.com/ipplan/admin/install.php) to continue with the web based installation.

___


**Backup IPplan database**
```
# mysqldump -u ipplan -pblink182 ipplan > ipplan.sql
```

**Restore IPplan database**
```
# mysql -u ipplan -pblink182 ipplan < ipplan.sql
```
