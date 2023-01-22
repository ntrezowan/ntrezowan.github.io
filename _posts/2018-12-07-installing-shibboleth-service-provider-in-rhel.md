---
title: "Installing Shibboleth Service Provider in RHEL"
comments: false
description: "Installing Shibboleth Service Provider in RHEL"
keywords: "shibboleth, service, provider, rhel"
published: true
---
> Operating System: _RHEL 7.5_  
> Web Server: _Apache 2.4_  
> Shibboleth: _3.0.2_  

---

### How Shib SP works?

Shibboleth and Apache/Nginx works together where Shibboleth uses a module to talk with Apache. When a web request comes for a protected resource, Apache (httpd) directs them to `mod_shib` module and then Shibboleth (shibd) checks `shibboleth2.xml` to see what to do and uses `attribute-map.xml` to know what attributes to get from the IdP.

The directories you want to protect need to be configured in Apache virtual host with `Location` tag. Shibboleth also has another virtual directory `/Shibboleth.sso/*` from where you can check Service Provider status, session data, metadata etc. Shibboleth uses `/Shibbleth.sso/` for all the communication between SP and IdP and passes attributes in either HTTP request header or in environment variable to the protected resource/application. While Apache handles all the browser based request on port 80/443, shibd uses port 8443 for all back channel communication with the IdP.

---
### Environment
*Apache:*  
/etc/httpd/ -> Configuration directory  
/var/log/httpd -> Log directory  
/etc/httpd/conf.d/shib.conf -> Virtual Host file for `/Shibboleth.sso/*`  

*Shibboleth:*  
/etc/shibboleth -> Configuration directory  
/var/log/shibboleth -> Log directory  
/var/run/shibboleth -> Runtime directory  
/var/cache/shibboleth -> Cache directory  
/etc/init.d/shibd -> Startup script (shibd)  
/var/log/shibboleth/transcation.log -> Transaction logs  
/var/log/shibboleth/shibd.log -> Metadata and security related logs  
/var/log/shibboleth/shibd_warn.log -> Logs containing issue with shibd process

*Permission:*  
If you plan to manage Shibboleth with a non-root user, then `shibd` user have to be the owner of `/var/log/shibboleth/*` directory because default owner for this folder is root if you install Shibboleth using yum. The issue here is that, logs will not be written if you use a non-root user to start/stop shibd daemon. 


---
### A. Installation
1. Install Apache, NTP and Shibboleth;
```
# yum install httpd ntp shibboleth.x86_64
```
2. Activate `shibd` at startup and start the service;
```
# sudo systemctl enable httpd.service
# sudo systemctl enable shibd.service
# sudo systemctl enable ntpd.service
```
3. Start Apache and Shibboleth SP;
```
# sudo service httpd start
# sudo service shibd start
```
4. Check if the services are running;
```
# ps aux | grep httpd
root     18366  0.0  0.4 328408 16532 ?        Ss   15:13   0:00 /usr/sbin/httpd
```
```
# ps aux | grep shibd
shibd     8104  0.0  0.6 766416 25724 ?        Ssl  Dec07   0:14 /usr/sbin/shibd -p /var/run/shibboleth/shibd.pid -f -w 30
```
5. Check if `mod_shib.so` module is loaded in Apache;
```
# httpd -M | grep mod_shib
mod_shib (shared)
Syntax OK
```
If the module is missing, check if `/etc/httpd/conf.d/shib.conf` has the following line;
```
LoadModule mod_shib /usr/lib64/shibboleth/mod_shib_22.so
```
If not, you can add the line either in `/etc/httpd/conf/httpd.conf` or in `/etc/httpd/conf.d/shib.conf` file but not in both place (Apache does not allow multiple module entry).

6. Check if there is any error;
```
# grep -E 'CRIT|ERROR' /var/log/shibboleth/shibd.log
```

7. Check if SELinux is enabled;
```
# sestatus
SELinux status:                 enabled
SELinuxfs mount:                /selinux
Current mode:                   permissive
Mode from config file:          enforcing
Policy version:                 24
Policy from config file:        targeted
```
If it is enabled then it is suggested to run in permissive mode. Follow the instruction at https://wiki.shibboleth.net/confluence/display/SP3/CommonErrors (Can't connect to listener process) where it explains how to create a policy so that SELinux allows httpd to access shibd pid.

8. Visit the following page;
```
https://example.com/Shibboleth.sso/Session
```
If it returns `A valid session was not found.`, it means `shibd` is running and working with Apache.

---

### B. Configuration
1. Configure `/etc/shibboleth/shibboleth2.xml` as following;
```
    <SPConfig xmlns="urn:mace:shibboleth:3.0:native:sp:config"
        xmlns:conf="urn:mace:shibboleth:3.0:native:sp:config"
        clockSkew="180">
        <OutOfProcess tranLogFormat="%u|%s|%IDP|%i|%ac|%t|%attr|%n|%b|%E|%S|%SS|%L|%UA|%a" />
        <ApplicationDefaults entityID="https://example.com/sp"
            homeURL="https://example.com/Shibboleth.sso/Session"
            REMOTE_USER="eppn subject-id pairwise-id persistent-id"
            cipherSuites="DEFAULT:!EXP:!LOW:!aNULL:!eNULL:!DES:!IDEA:!SEED:!RC4:!3DES:!kRSA:!SSLv2:!SSLv3:!TLSv1:!TLSv1.1">
            <Sessions lifetime="7200" timeout="3600" relayState="ss:mem"
                      checkAddress="false" handlerSSL="true" cookieProps="https">
                <SSO entityID="https://example.com/idp"
                     discoveryProtocol="SAMLDS" discoveryURL="https://ds.example.org/DS/WAYF">
                  SAML2
                </SSO>
                <Logout>SAML2 Local</Logout>
                <LogoutInitiator type="Admin" Location="/Logout/Admin" acl="127.0.0.1 ::1 10.10.10.111 10.10.10.222" />
                <Handler type="MetadataGenerator" Location="/Metadata" signing="false"/>
                <Handler type="Status" Location="/Status" acl="127.0.0.1 ::1 10.10.10.111 10.10.10.222"/>
                <Handler type="Session" Location="/Session" showAttributeValues="false"/>
                <Handler type="DiscoveryFeed" Location="/DiscoFeed"/>
            </Sessions>
            <Errors supportContact="root@localhost"
                helpLocation="/about.html"
                styleSheet="/shibboleth-sp/main.css"/>
            <MetadataProvider type="XML" path="/etc/shibboleth/idp-metadata/idp-metadata.xml"/>
            <AttributeExtractor type="XML" validate="true" reloadChanges="false" path="attribute-map.xml"/>
            <AttributeFilter type="XML" validate="true" path="attribute-policy.xml"/>
            <CredentialResolver type="File" use="signing"
                key="/etc/shibboleth/certs/sp-key.pem" certificate="/etc/shibboleth/certs/sp-cert.pem"/>
        </ApplicationDefaults>
        <SecurityPolicyProvider type="XML" validate="true" path="security-policy.xml"/>
        <ProtocolProvider type="XML" validate="true" reloadChanges="false" path="protocols.xml"/>
    </SPConfig>
```
2. Create a self-signed cert and save it in `/etc/shibboleth/certs` folder;
```
# openssl req -x509 -sha256 -nodes -days 3650 -newkey rsa:2048 -subj "/CN=example.com" -keyout /etc/shibboleth/certs/sp-key.pem -out /etc/shibboleth/certs/sp-cert.pem
```
Verify the content of the cert;
```
# openssl rsa -in /etc/shibboleth/certs/sp-key.pem -text
# openssl x509 -noout -in /etc/shibboleth/certs/sp-cert.pem -text
```
Verify cert fingerprint;
```
# openssl x509 -noout -in /etc/shibboleth/certs/sp-cert.pem -fingerprint -sha1
```
3. Generate metadata for SP;
```
# /etc/shibboleth/metagen.sh -c /etc/shibboleth/certs/sp-cert.pem -h example.com -e https://example.com/sp > /etc/shibboleth/sp-metadata.xml
```
4. Obtain IdP metadata and copy it to `/etc/shibboleth/idp-metadata/` folder.

5. You can protect a resource by either defining a `Location` in `/etc/httpd/conf.d/httpd_ssl.conf` or modifying `/etc/httpd/conf.d/shibd.conf`. Here we are modifying `/etc/httpd/conf.d/shib.conf` to the following so that if a user visit `https://example.com/resources`, they will be sent to IdP to login before accessing the location. 
```
    <Location /resources>
      AuthType shibboleth
      ShibRequestSetting requireSession 1
      require shib-session
    </Location>
```
It is strongly suggested to create separate virtual host preferably in `/etc/httpd/conf.d/httpd_ssl.conf` file and also tell `/etc/httpd/conf/httpd.conf` to load `mod_shib.so` because `/etc/httpd/conf.d/shib.conf` will be overwritten everytime Shibboleth is updated. 

6. Create an `index.php` file under `/var/www/html/resources` (assuming `DocumentRoot=/var/www/html`) with the following and give it 755 permission;
```
    <html>
    <head><title>SP Testing Page</title></head>
    <body><pre><?php print_r($_SERVER); ?></pre></body>
    </html>
```
7. Restart shibd to load IdP metadata and certificate;
```
# sudo service shibd restart
```
8. Check if metadata loaded properly;
```
# grep idp-metadata.xml /var/log/shibboleth/shibd.log
loaded XML resource (/idp-metadata/idp-metadata.xml)
```

---

### C. Test
1. Go to the following page and it will display `Status` as `OK`;
```
https://example.com/Shibboleth.sso/Status
```
2. Go to the following page;
```
https://example.com/resources/index.php
```
Your browser will be connected to Apache on port 443 and since the `AuthType` for `/resources` in `shib.conf` is `shibboleth`, you will be redirected to `https://example.com/idp`. After logging in, you will be redirected to `/resources` location and `index.php` will show core Shibboleth attributes and server header.

3. To test if SP is getting the attributes from IdP, go to;
```
https://example.com/Shibboleth.sso/Login
```
After successful login, you will get the following;
```
Miscellaneous
Session Expiration (barring inactivity): 120 minute(s)
Client Address: 192.168.12.13
SSO Protocol: urn:oasis:names:tc:SAML:2.0:protocol
Identity Provider: https://example.com/idp
Authentication Time: 2018-12-10T21:36:41.536Z
Authentication Context Class: urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
Authentication Context Decl: (none)
Attributes	
affiliation: 1 value(s)
displayName: 1 value(s)
eppn: 1 value(s)
givenName: 1 value(s)
mail: 1 value(s)
sn: 1 value(s)
unscoped-affiliation: 2 value(s)
```

---

#### Sample httpd_ssl.conf
```
    Listen 443

    SSLPassPhraseDialog  	builtin
    SSLSessionCache         shmcb:/var/cache/mod_ssl/scache(512000)
    SSLSessionCacheTimeout  300

    SSLMutex default

    SSLRandomSeed startup file:/dev/urandom  256
    SSLRandomSeed connect builtin
    #SSLRandomSeed startup file:/dev/random  512
    #SSLRandomSeed connect file:/dev/random  512
    #SSLRandomSeed connect file:/dev/urandom 512

    SSLCryptoDevice builtin
    SSLEngine on

    SSLProtocol all -SSLv2

    SSLCipherSuite ALL:!ADH:!EXPORT:!SSLv2:RC4+RSA:+HIGH:+MEDIUM:+LOW

    SSLCertificateFile /etc/httpd/ssl/example.com.crt
    SSLCertificateKeyFile //etc/httpd/ssl/example.com.key

    <VirtualHost _default_:443>

    ServerName example.com
    ServerAdmin root@example.com

    DocumentRoot "/var/www/html/"

    <Directory /var/www/html>
    Allow from all
    Options -MultiViews
    </Directory>
    <Directory "/var/www/cgi-bin">
        SSLOptions +StdEnvVars
    </Directory>

    <Location "/Shibboleth.sso">
                SetHandler shib-handler
    </Location>
    <Location "/resources/">
                AuthType shibboleth
                ShibRequestSetting requireSession 1
                require valid-user
    </Location>

    <Files ~ "\.(cgi|shtml|phtml|php3?)$">
        SSLOptions +StdEnvVars
    </Files>

    SetEnvIf User-Agent ".*MSIE.*" \
             nokeepalive ssl-unclean-shutdown \
             downgrade-1.0 force-response-1.0

    ErrorLog ${APACHE_LOG_DIR}/error.log
    TransferLog ${APACHE_LOG_DIR}/transfer.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
    LogLevel warn

    </VirtualHost>
```
