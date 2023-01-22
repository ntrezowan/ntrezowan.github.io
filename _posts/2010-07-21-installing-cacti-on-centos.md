---
title: "Installing Cacti on CentOS"
comments: false
description: "Installing Cacti on CentOS"
keywords: "cacti, install, centos, apache, mysql"
---
> Operating System: _CentOS 5_  
> Web Server: _Apache 2.2_  
> Database: _MySQL 5.1_  

___

### A. Install prerequisites

1. Define a repo for [dag.wieers.org](http://www.blogger.com/dag.wieers.org) to install Cacti dependencies;
```
# vi /etc/yum.repos.d/dag.repo
```
Add the following lines in `dag.repo` file;
```
[dag] name=Dag RPM Repository for Red Hat Enterprise Linux
baseurl=http://apt.sw.be/redhat/el5/en/i386/dag
gpgcheck=1
gpgkey=http://dag.wieers.com/rpm/packages/RPM-GPG-KEY.dag.txt
enabled=1
```

2. Update OS;
```
# yum update
```

3. Install prerequisite packages (such as Apache, MySQL, rrdtool etc.);
```
# yum install php httpd mysql mysql-server php-mysql vim-enhanced initscripts perl-rrdtool rrdtool initscripts
```

___

### B. Install Cacti

1. Download [Cacti](http://www.cacti.net), extract and move to `/var/www/html/`;
```
# tar xzvf cacti-x.x.xx.tar.gz
# mv cacti-x.x.xx cacti
# mv cacti /var/www/html
```

2. Create a Cacti user `cacti` and add the user to a Cacti group `cactiuser`;
```
# /usr/sbin/groupadd cacti
# /usr/sbin/useradd -g cacti cactiuser
# passwd cactiuser
```

3. Change the ownership of `/var/www/html/cacti/rra/` and `/var/www/html/cacti/log/` directories;
```
# cd /var/www/html/cacti
# chown -R cactiuser rra/ log/
```

4. Create a MySQL database for Cacti called `cacti`;
```
# mysqladmin --user=root --password=blink182 create cacti
```

5. Go to `/var/www/html/cacti`, and use `cacti.sql` to create tables for the database;
```
# cd /var/www/html/cacti
# mysql --user=root --password=blink182 cacti < cacti.sql
```

6. Create a mySQL username and password for Cacti;
```
# mysql --user=root --password=blink182
mysql> GRANT ALL ON cacti.* TO cactiuser@example.com IDENTIFIED BY 'blink182';
mysql> flush privileges;
mysql> exit
```

7. Edit `/var/www/html/cacti/include/config.php` file to the following;
```
$database_type = "mysql";
$database_default = "cacti";
$database_hostname = "example.com";
$database_username = "cactiuser";
$database_password = "blink182";
$database_port = "3306";
```

8. Edit php config file `/etc/php.ini` to allow more memory usage for Cacti;
```
# vi /etc/php.ini
```
Change the `memory_limit` to `128M`;
```
memory_limit = 128M
```

___

### C. Install SNMP

1. Insall SNMP using the following command;
```
# yum install net-snmp net-snmp-utils php-snmp net-snmp-libs
```

2. To Configure SNMP, open the `/etc/snmp/snmpd.conf` file;
```
# vi /etc/snmp/snmpd.conf
```
The following lines should be included in the `snmpd.conf` file;
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

___

### D. Configure Apache for Cacti

1. Open `/etc/httpd/conf.d/cacti.conf` file;
```
# vi /etc/httpd/conf.d/cacti.conf
```
The following lines should be included in `cacti.conf` file;
``` 
Alias /cacti /usr/share/cacti
< Directory /usr/share/cacti/>
Order Deny,Allow
Deny from all
Allow from x.x.x.x/xx
< /Directory>
```

2. Open `/etc/cron.d/cacti` to set a cronjob;
```
# vi /etc/cron.d/cacti
```
The following line should be included in the crontab;
```
*/5 * * * * cacti /usr/bin/php /usr/share/cacti/poller.php > /dev/null 2>&1
```

3. Restart all the services;
```
# service httpd restart
# service mysqld restart
# service snmpd restart
```

___

Browse to [http://example.com/cacti](http://example.com/cacti) and log in as `admin` using password `admin`.

___


**Backup Cacti database**

To backup Cacti MySQL database;
```
# mysqldump -p cacti > cacti.mysql
```

**Backup Cacti RRD**

To backup Cacti rrd data;
```
# mkdir rra
# cd rra
# cp /var/lib/cacti/rra/*.rrd ./
# chown rezowan:rezowan *.rrd
# for i in *.rrd; do rrdtool dump "$i" "$i".xml; done
```

**Restore Cacti database**

To restore Cacti MySQL database;
```
# mysql -p cacti < cacti.mysql
```

**Restore Cacti RRD**

To restore Cacti rrd data;
```
# cd rra
# for i in *.xml; do rrdtool restore "$i" "$i".rrd; done
# for i in *.rrd.xml.rrd; do mv "$i" `echo "$i" | sed s/.xml.rrd//g`; done
# cp *.rrd /var/lib/cacti/rra/
# chown www-data:www-data /var/lib/cacti/rra/*.rrd
```
