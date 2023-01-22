---
title: "Installing AWStats on CentOS"
comments: false
description: "Installing AWStats on CentOS"
keywords: "awstats, install, centos, apache, mysql"
published: true
---
> Operating System: _CentOS 5_  
> Web Server: _Apache 2.2_  
> Database: _MySQL 5.1_  

___

1. Install EPEL software repository, and then install AWStats;
```
# yum install epel-release
# yum install awstats
```

2. Download [GeoIP](http://geolite.maxmind.com/download/geoip/database/GeoLiteCountry/GeoIP.dat.gz) and [GeoLiteCity](http://geolite.maxmind.com/download/geoip/database/GeoLiteCity.dat.gz) from maxmind.com and move it to `tmp`;
```
# mkdir /var/www/html/GeoIP
# cd /var/www/html/GeoIP
# mv /tmp/GeoIP.dat.gz GeoIP.dat.gz
# mv /tmp/GeoLiteCity.dat.gz GeoLiteCity.dat.gz
# gunzip GeoIP.dat.gz
# gunzip GeoLiteCity.dat.gz
```

3. Edit AWStats config;
```
# cd /etc/awstats
# cp awstats.model.conf awstats.model.conf.orig
# cp awstats.model.conf.orig awstats.stats.example.com.conf
```  

4. Create directories for new subdomain `stats.example.com`;
```
# mkdir /var/www/html/stats.example.com
# mkdir /var/www/html/stats.example.com/cgi-bin
```

5. Copy AWStats files to newly created `stats.example.com/cgi-bin` directory;
```
# cd /usr/share/awstats/wwwroot/
# cp -R * /var/www/html/stats.example.com/
```

6. Open Apache configuration file and add an entry for this new subdomain;
```
# vi /etc/httpd/conf/httpd.conf
```  
Add the following lines in `httpd.conf`;
```  
    <virtualhost *:80>
    ServerAdmin admin@example.com
    ServerName example.com
    ServerAlias www.example.com
    DocumentRoot /var/www/html/example.com
    ScriptAlias /cgi-bin/ /var/www/html/example.com/cgi-bin/
    CustomLog logs/example.com_access_log combined
    ErrorLog logs/example.com_error_log
    </VirtualHost>
```  

7. For AWStats subdomain, add the following in `httpd.conf`;
```
    <virtualhost *:80>
    ServerAdmin admin.awstats@example.com
    ServerName stats.example.com
    DocumentRoot /var/www/html/stats.example.com
    ScriptAlias /cgi-bin/ /var/www/html/stats.example.com/cgi-bin/
    CustomLog logs/example.com.stats_access_log combined
    ErrorLog logs/example.com.stats_error_log
    Alias /classes "/var/www/html/stats.example.com/classes/"
    Alias /css "/var/www/html/stats.example.com/css/"
    Alias /icon "/var/www/html/stats.example.com/icon/"
    ScriptAlias /awstats/ "/var/www/html/stats.example.com/cgi-bin/"
    </VirtualHost>
```  

8. Next, edit `/etc/httpd/conf.d/awstats.conf` to include directory path for new subdomain;
```
# vi /etc/httpd/conf.d/awstats.conf
```
Add the following lines;
```
    <Directory "/var/www/html/stats.example.com">
    DirectoryIndex awstats.pl
    Options ExecCGI
    Options FollowSymLinks
    Options None
    AllowOverride None
    Order allow,deny
    Allow from all
```

9. Now edit the `awstats.stats.example.com.conf` and add the following lines;
```
# vi /etc/awstats/awstats.stats.example.com.conf
```
Add/edit the following lines;
```
LogFile="/var/log/httpd/example.com_access_log"
SiteDomain="stats.example.com"
HostAliases="stats.example.com"
DirData="/var/www/html/stats.example.com/"
LoadPlugin="geoip GEOIP_STANDARD /var/www/html/GeoIP/GeoIP.dat"
LoadPlugin="geoip_city_maxmind GEOIP_STANDARD /var/www/html/GeoIP/GeoLiteCity.dat"
```

10. Restart Apache web server;
```
# service httpd restart
```

11. Run AWStats perl script to automatically update stats;
```
# perl /var/www/html/stats.example.com/cgi-bin/awstats.pl -config=stats.example.com -update
```


12. To update AWStats automatically every hour, create a cronjob;
```
# cd /etc/cron.hourly && vi 01awstats
```
Add the following line;
```
perl /var/www/html/stats.example.com/cgi-bin/awstats.pl -config=stats.example.com -update > /dev/null 2>&1
```
Now, set permission and restart crond;
```
# chmod 755 01awstatsservice crond restart
```

---

Browse to [http://stats.example.com/cgi-bin/awstats.pl](http://stats.example.com/cgi-bin/awstats.pl) to see site stats for  `example.com`.
