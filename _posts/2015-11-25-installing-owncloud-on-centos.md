---
title: "Installing OwnCloud on CentOS"
comments: false
description: "Installing OwnCloud on CentOS"
keywords: "owncloud, install, centos, nginx, mariadb"
---
> Operating System: _CentOS 7_  
> Web Server: _Nginx 1.8.0_  
> Database: _MariaDB 5.5.44_  
  
___

1. Import Nginx repository;  
```
# yum -y install epel-release
# rpm -Uvh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-x-x.elx.ngx.noarch.rpm
```

2. Install web server, database and other dependencies;  
```
# yum -y install nginx mariadb mariadb-server php-fpm php-cli php-gd php-mcrypt php-mysql php-pear php-xml bzip2
```

3. SELINUX is enabled by default, so create iptables and SELINUX rule to allow HTTP/HTTPS traffic;  
```
# iptables -I INPUT -p tcp --dport 80 -j ACCEPT
# iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
# firewall-cmd --permanent --add-service=http
# firewall-cmd --permanent --add-service=https
# firewall-cmd –reload
```

4. Start MariaDB, remove default configuration and set the root password;  
```
# systemctl start mariadb
# mysql_secure_installation
[Removed all the default database and user configuration]
# mysql -u root –p
```

5. Configure php-fpm;  
```
# nano /etc/php-fpm.d/www.conf
```
[Sample configuration]
```
# grep -v "^;" /etc/php-fpm.d/www.conf | grep -v "^$"
[www]
listen = 127.0.0.1:9000
listen.allowed_clients = 127.0.0.1
user = nginx
group = nginx
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
slowlog = /var/log/php-fpm/www-slow.log
env[PATH] = /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/
php_admin_value[error_log] = /var/log/php-fpm/www-error.log
php_admin_flag[log_errors] = on
php_value[session.save_handler] = files
php_value[session.save_path] = /var/lib/php/session
```

6. Add permission for the web server in php-fpm;
```
# mkdir -p /var/lib/php/session
# chown nginx:nginx -R /var/lib/php/session/
```
7. Start php-fpm and Nginx daemon;
```
# systemctl start php-fpm
# systemctl start nginx
```

8. Verify if php-fpm can access environment path;
```
# printenv PATH
```
The printenv PATH output is required to verify if php-fpm can have access to all the `env[PATH]`. If `env[PATH]` and `printenv PATH` are different, then define those paths.

9. Create self-signed SSL certification with default configuration;  
```
# mkdir -p /etc/nginx/cert/
# cd /etc/nginx/cert/
# openssl req -new -x509 -days 365 -nodes -out /etc/nginx/cert/owncloud.crt -keyout /etc/nginx/cert/owncloud.key
# cd /etc/nginx/cert/
# cat owncloud.crt
# cat owncloud.key
# chmod 600 owncloud.crt
# chmod 600 owncloud.key
This crt/key is only valid for one year.
```

10. Download OwnCloud [source](https://github.com/owncloud), extracting the tar.bz2 in `/tmp` and then move it into Nginx html folder;  
```
# cd /tmp/
# wget https://download.owncloud.org/community/owncloud-x.x.x.tar.bz2
# tar -xjvf owncloud-x.x.x.tar.bz2
# mv owncloud/ /usr/share/nginx/html/
# cd /usr/share/nginx/html/
# chown nginx:nginx -R owncloud/
```

11. Create `data` folder where OwnCloud will store all the user files;  
```
# mkdir -p owncloud/data/
# chown nginx:nginx -R owncloud/data/
```

12. Edit Nginx configuration so that it only accepts HTTPS connection;  
```
# cd /etc/nginx/conf.d/
# mv default.conf default
# nano default
[Sample Configuration]
# cat default
upstream php-handler {
server 127.0.0.1:9000;
#server unix:/var/run/php5-fpm.sock;
}
server {
listen 80;
server_name example.com;
#return 301 https://$server_name$request_uri;
return 301 https://$server_name;
}
server {
listen 443 ssl;
server_name example.com;
#SSL Certificate
ssl_certificate /etc/nginx/cert/owncloud.crt;
ssl_certificate_key /etc/nginx/cert/owncloud.key;
# owncloud path
root /usr/share/nginx/html/owncloud/;
client_max_body_size 10G; # set max upload size
fastcgi_buffers 64 4K;
rewrite ^/caldav(.*)$ /remote.php/caldav$1 redirect;
rewrite ^/carddav(.*)$ /remote.php/carddav$1 redirect;
rewrite ^/webdav(.*)$ /remote.php/webdav$1 redirect;
index index.php;
error_page 403 /core/templates/403.php;
error_page 404 /core/templates/404.php;
location = /robots.txt {
allow all;
log_not_found off;
access_log off;
}
location ~ ^/(data|config|\.ht|db_structure\.xml|README) {
deny all;
}
location / {
# The following 2 rules are only needed with webfinger
rewrite ^/.well-known/host-meta /public.php?service=host-meta last;
rewrite ^/.well-known/host-meta.json /public.php?service=host-meta-json last;
rewrite ^/.well-known/carddav /remote.php/carddav/ redirect;
rewrite ^/.well-known/caldav /remote.php/caldav/ redirect;
rewrite ^(/core/doc/[^\/]+/)$ $1/index.html;
try_files $uri $uri/ index.php;
}
location ~ ^(.+?\.php)(/.*)?$ {
try_files $1 = 404;
include fastcgi_params;
fastcgi_param SCRIPT_FILENAME $document_root$1;
fastcgi_param PATH_INFO $2;
fastcgi_param HTTPS on;
fastcgi_pass php-handler;
}
# Optional: set long EXPIRES header on static assets
location ~* ^.+\.(jpg|jpeg|gif|bmp|ico|png|css|js|swf)$ {
expires 30d;
# Optional: Don't log access to assets
access_log off;
}
}
```

13. Setup Nginx, MariaDB and php-fpm to start automatically at startup and reboot the server;  
```
# systemctl enable nginx mariadb php-fpm
# init 6
```

___

Browse to [https://example.com/](https://example.com) and log in as `admin` using password `admin`.

___

**Customize OwnCloud Footer**

To customize your OwnCloud footer, change it to the following;  
```
# vi /usr/share/nginx/html/owncloud/lib/private/defaults.php
[Sample output]
function __construct() {
       $this->l = \OC::$server->getL10N('lib');
       $version = OC_Util::getVersion();
       $this->defaultEntity = 'your_department_name';
       $this->defaultName = 'your_company_short_name';
       $this->defaultTitle = 'your_company_name';
       $this->defaultBaseUrl = 'your_FQDN_url';
       $this->defaultSyncClientUrl = 'https://owncloud.org/sync-clients/';
       $this->defaultiOSClientUrl = 'https://itunes.apple.com/us/app/owncloud/id543672169?mt=8';
       $this->defaultiTunesAppId = '543672169';
       $this->defaultAndroidClientUrl = 'https://play.google.com/store/apps/details?id=com.owncloud.android';
       $this->defaultDocBaseUrl = 'https://doc.owncloud.org';
       $this->defaultDocVersion = $version[0] . '.' . $version[1]; // used to generate doc links
       $this->defaultSlogan = $this->l->t('your_company_name');
       $this->defaultLogoClaim = '';
       $this->defaultMailHeaderColor = '#1d2d44'; /* header color of mail notifications */
```
