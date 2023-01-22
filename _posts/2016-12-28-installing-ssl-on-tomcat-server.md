---
title: "Installing SSL on Tomcat Server"
comments: false
description: "Installing SSL on Tomcat Server"
keywords: "ssl, certificate, install, java, keytool, windows, apache, tomcat, linux, unix"
---

## A. Red Hat Enterprise Linux
Java Keytool location: `/usr/bin/java`  
Tomcat config location: `/opt/tomcat/conf`  
Tomcat keystore location: `/opt/tomcat/conf/certs`

### 1. Create new keystore to install a new certificate

1. Login to the server and create new keystore (SHA-2) in the Tomcat keystore folder;  
```
# /usr/bin/java/keytool -genkey -alias example.com -keyalg RSA -keystore /opt/tomcat/conf/certs/example.com.jks -keysize 2048
Enter keystore password:
Re-enter new password:
What is your first and last name?
  [Unknown]:  example.com
What is the name of your organizational unit?
  [Unknown]:  Information Technology
What is the name of your organization?
  [Unknown]:  Internet Assigned Numbers Authority
What is the name of your City or Locality?
  [Unknown]:  Los Angeles
What is the name of your State or Province?
  [Unknown]:  California
What is the two-letter country code for this unit?
  [Unknown]:  US
Is CN=example.com, OU=Information Technology, O=Internet Assigned Numbers Authority, L=Los Angeles, ST=California, C=US correct?
  [no]:  yes
Enter key password for <example.com>
	(RETURN if same as keystore password):
Re-enter new password:
```
The password that is used here will require every time we open/modify this newly created keystore file.

2. Generate a new CSR for `example.com` domain;
```
# /usr/bin/java/keytool -certreq -alias example.com -keystore /opt/tomcat/conf/certs/example.com.jks -file /opt/tomcat/conf/certs/example.com.csr
Enter keystore password:
```

3. Use `example.com.csr` to get a new certificate From a CA. Save intermediate certificate as `intermediate.crt` and site certificate as `example.com.crt`. Transfer both certs at `/opt/tomcat/conf/certs/`.

4. Import intermediate certificate to the Tomcat keystore;
```
# /usr/bin/java/keytool -import -trustcacerts -alias intermediate -file /opt/tomcat/conf/certs/intermediate.crt -keystore /opt/tomcat/conf/certs/example.com.jks
Enter keystore password:
Certificate was added to keystore
```

5. Verify that intermediate certificate is imported correctly;
```
# /usr/bin/java/keytool -list -v -alias intermediate -keystore /opt/tomcat/conf/certs/example.com.jks | more
```

6. Import site certificate (example.com) to the Tomcat keystore;
```
# /usr/bin/java/keytool -import -alias example.com -trustcacerts -file /opt/tomcat/conf/certs/example.com.crt -keystore /opt/tomcat/conf/certs/example.com.jks
Enter keystore password:
Certificate reply was installed in keystore
```

7. Verify that site certificate is imported correctly;
```
# /usr/bin/java/keytool -list -v -alias example.com -keystore /opt/tomcat/conf/certs/example.com.jks | more
```

8. Open `server.xml` file located at `/opt/tomcat/conf/` and look for `keystoreFile` string. Modify it to the following;
```
keystoreFile="conf/certs/example.com.jks"
```

9. Restart Apache Tomcat service.

10. Verify the changes by visiting hosted site's certificate;  
```
# openssl s_client -connect www.example.com:443 | openssl x509 -noout -issuer -subject -dates
depth=2 /C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
verify error:num=19:self signed certificate in certificate chain
verify return:0
issuer= /C=US/O=DigiCert Inc/CN=DigiCert SHA2 Secure Server CA
subject= /C=US/ST=California/L=Los Angeles/O=Internet Corporation for Assigned Names and Numbers/OU=Technology/CN=www.example.org
```

### 2. Renew certificate for an existing keystore

1. Generate the CSR from from your machine and obtain the certificate from CA. Transfer both `example.com.crt` and `example.com.key` file to `/opt/tomcat/conf/certs/`.

2. Create pcks12 using the crt and key;
```
# openssl pkcs12 -export -out /opt/tomcat/conf/certs/example.com.pfx -inkey /opt/tomcat/conf/certs/example.com.key -in /opt/tomcat/conf/certs/example.com.crt
```

3. Create jks using the pcks12 with an alias `example.com`;
```
# /usr/bin/java/keytool -importkeystore -srckeystore /opt/tomcat/conf/certs/example.pfx -srcstoretype pkcs12 -destkeystore /opt/tomcat/conf/certs/example.com.jks -deststoretype jks -destalias example.com
```

4. Check the certificate;
```
#  /usr/bin/java/keytool -list -v -keystore /opt/tomcat/conf/certs/example.com.jks -alias example.com
```

5. Open `server.xml` file located at `/opt/tomcat/conf/` and look for `keystoreFile` string. Modify it to the following;
```
keystoreFile="conf/certs/example.com.jks"
```
4. Restart Apache Tomcat service.

5. Verify the changes by visiting hosted site's certificate.


### 3. Install root/intermediate to Java keystore


1. The root/intermediate certs are stored in `cacerts` keystore file located in `/usr/bin/java/jre/lib/security/`.

2. To install a root CA certificate, copy the root certificate to `/tmp` folder and save as `root.cer`. Run the following command to import the certificate;
```
# /usr/bin/java/keytool -import -alias rootca -file /tmp/root.cer -keystore /usr/bin/java/jre/lib/security/cacerts
Enter keystore password:
```
Here the `cacerts` keystore password is `changeit` (Default).

3. To view all the root certificate, run the following command;
```
# /usr/bin/java/keytool -list -v -keystore /usr/bin/java/jre/lib/security/cacerts | grep Alias | sort
Enter keystore password:
```

4. If you want to add an intermediate to `cacerts`, run the following to add the intermediate (assuming `intermediate.cer` is in `/tmp`);
```
# /usr/bin/java/keytool -import -alias intermediateca -file /tmp/intermediate.cer -keystore /usr/bin/java/jre/lib/security/cacerts
Enter keystore password:
```

---

## B. Windows Server

Java Keytool location: `C:\Program Files\Java\jre\bin\`  
Tomcat config location: `C:\Program Files\Apache Tomcat\conf\`  
Tomcat keystore location: `C:\Program Files\Apache Tomcat\conf\SSL\`


### 1. Create new keystore to install a new certificate

1. Open Command Prompt as Administrator and create new keystore (SHA-2) in the Tomcat keystore folder;  
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -genkey -alias example.com -keyalg RSA -keystore keystore-example.com.jks -keysize 2048  
Enter keystore password:
Re-enter new password:
What is your first and last name?
[Unknown]:  example.com
What is the name of your organizational unit?
[Unknown]:  Information Technology
What is the name of your organization?
[Unknown]:  Internet Assigned Numbers Authority
What is the name of your City or Locality?
[Unknown]:  Los Angeles
What is the name of your State or Province?
[Unknown]:  California
What is the two-letter country code for this unit?
[Unknown]:  US
Is CN=example.com, OU=Information Technology, O=Internet Assigned Numbers Authority, L=Los Angeles, ST=California, C=US correct?
  [no]:  yes
Enter key password for <example.com>
        (RETURN if same as keystore password):
Re-enter new password:
```
The password that is used here will require every time we open/modify this newly created keystore file.

2. Generate a new CSR for `example.com` domain;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -certreq -alias example.com -keystore keystore-example.com.jks -file C:\Users\Administrator\Desktop\example.com.csr
Enter keystore password:
```

3. Use `example.com.csr` to get a new certificate From a CA. Save intermediate certificate as `intermediate.cer` and site certificate as `example.com.p7b`. Copy both to `C:\Users\Administrator\Desktop\` folder on the server.

4. Import intermediate certificate to the tomcat keystore;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -import -trustcacerts -alias intermediate -file C:\Users\Administrator\Desktop\intermediate.cer -keystore keystore-example.com.jks
Enter keystore password:
Certificate was added to keystore
```

5. Verify that intermediate certificate is imported correctly;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -list -v -alias intermediate -keystore keystore-example.com.jks
```

6. Import site certificate (example.com) to the tomcat keystore;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -import -alias example.com -trustcacerts -file C:\Users\Administrator\Desktop\example.com.p7b -keystore keystore-example.com.jks
Enter keystore password:
Certificate reply was installed in keystore
```

7. Verify that site certificate is imported correctly;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -list -v -alias example.com -keystore keystore-example.com.jks
```

8. Open `server.xml` file located in `C:\Program Files\Apache Tomcat\conf\` using Notepad and look for `keystoreFile` string. Modify it to the following;
```
keystoreFile="conf/SSL/keystore-example.com.jks"
```

9. Restart Apache Tomcat service from Windows Services.

10. Verify the changes by visiting hosted site's certificate;  
```
# openssl s_client -connect www.example.com:443 | openssl x509 -noout -issuer -subject -dates
depth=2 /C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
verify error:num=19:self signed certificate in certificate chain
verify return:0
issuer= /C=US/O=DigiCert Inc/CN=DigiCert SHA2 Secure Server CA
subject= /C=US/ST=California/L=Los Angeles/O=Internet Corporation for Assigned Names and Numbers/OU=Technology/CN=www.example.org
```

### 2. Renew certificate for an existing keystore


1. Take a backup of the current site certificate;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -export -alias example.com -file C:\Users\Administrator\Desktop\example.com-old.crt -keystore keystore-example.com.jks
```
Also take a backup of the `keystore-example.com.jks` keystore file.

2. Obtain the renewed certificate from CA and save it as `example.com.p7b` format. Copy the file to `C:\Users\Administrator\Desktop\` folder in the server;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -import -alias example.com -trustcacerts -file C:\Users\Administrator\Desktop\example.com.p7b -keystore keystore-example.com.jks
Enter keystore password:
Certificate reply was installed in keystore
```

3. Verify that site certificate is imported correctly;
```
C:\Program Files\Apache Tomcat\conf\SSL\>C:\Program Files\Java\jre\bin\keytool -list -v -alias example.com -keystore keystore-example.com.jks
```

4. Restart Apache Tomcat service from Windows Services.

5. Verify the changes by visiting hosted site's certificate.


### 3. Install root/intermediate to Java keystore


1. The root/intermediate certs are stored in `cacerts` keystore file located in `C:\Program Files\Java\jre\lib\security\`.

2. To install a root certificate, copy the root certificate to `C:\Users\Administrator\Desktop\` folder and save as `root.cer`. Run the following command to import the certificate;
```
C:\Program Files\Java\jre\lib\security\>C:\Program Files\Java\jre\bin\keytool -import -trustcacerts -alias rootca -file C:\Users\Administrator\Desktop\root.cer -keystore cacerts
Enter keystore password:
```
Here the `cacerts` keystore password is `changeit` (Default).

3. To view all the root certificate, run the following command;
```
C:\Program Files\Java\jre\lib\security\>C:\Program Files\Java\jre\bin\keytool -list -v -keystore cacerts
Enter keystore password:
```

4. If you want to add an intermediate to `cacerts`, run the following to add the intermediate (assuming `intermediate.cer` is in `C:\Users\Administrator\Desktop\`);
```
C:\Program Files\Java\jre\lib\security\>C:\Program Files\Java\jre\bin\keytool -import -alias intermediate -file C:\Users\Administrator\Desktop\intermediate.cer -keystore cacerts
```
