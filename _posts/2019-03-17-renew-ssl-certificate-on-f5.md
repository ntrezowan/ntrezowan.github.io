---
title: "Renew SSL Certificate on F5"
comments: false
description: "Renew SSL Certificate on F5"
keywords: "renew, ssl, certificate, f5, device"
published: true
---

### Renew SSL certificate using CSR

#### A. Create a CSR on F5
If you want to create a Certificate Signing Request (CSR) on F5, do the following;  
1. The following will create a CSR (example.csr) for a site, `example.com` and will also generate a private key (example.key);
```
# tmsh 
# create sys crypto key example.key key-size 2048 gen-csr country US city 'Los Angeles' state CA organization 'Internet Assigned Numbers Authority' ou 'Information Technology' common-name example.com email-address admin@example.com
```
2. To view the new CSR info, do the following;
```
# list sys crypto csr example.csr
-----BEGIN CERTIFICATE REQUEST-----
MIIDLDCCAhQCAQAwgbcxCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEUMBIGA1UE
BxMLTG9zIEFuZ2VsZXMxLDAqBgNVBAoTI0ludGVybmV0IEFzc2lnbmVkIE51bWJl
cnMgQXV0aG9yaXR5MR8wHQYDVQQLExZJbmZvcm1hdGlvbiBUZWNobm9sb2d5MRQw
EgYDVQQDEwtleGFtcGxlLmNvbTEgMB4GCSqGSIb3DQEJARYRYWRtaW5AZXhhbXBs
ZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC2jC9nKhArCZ4h
s/WRztIwc4adZKiXtQHtNkpOOK5VOUXEnR95mRIk7E2OEqYGqnRI74/LrBwQKM0K
HscHiZUJu9IbM50bAyyvbXmHLyaUalRXJE0FGD+Yy7hWWfBsP8VSVBdNGli/Wlgy
IxCKq4WBrrcpxIxBqkeWamjAk2mPG/hs1pGQwLflXxA/bXiZ4uhHTZxe2eDM0qMB
tbAaeCr4lxSmAIqZ7TLbgcrfcoUTcEF4N5D5Z7IgdtfBs2to8pRnOEytwBUxs9u+
NYYNhFDrhhgd4gIW1ymRHWio6fa5lspXve2DOjVm8atylWJ0nUdqoZ6uXbstkJgp
aR9uVWoDAgMBAAGgLzAtBgkqhkiG9w0BCQ4xIDAeMBwGA1UdEQQVMBOBEWFkbWlu
QGV4YW1wbGUuY29tMA0GCSqGSIb3DQEBCwUAA4IBAQB79l3HY3zBdN4KBONA43m8
hFpXVuOt0gVycemjc7tmurxn7IKrQhUAEQPrpYYQqN9CVH6y62fvMSKIXhwL99Du
02XiF6ySSETja+x4ghT3wYtIca181IYWyeJ3FGLt2eJRz3TZWtwcyofj22jld8ny
/iHrfPBZqKN2tZbAafusJ6Lib4X4RgohL+e2DEcVL/mraVtjw0hi0tzyVZR3j9Qh
Xt27FcoUzOxl6tmToL4Gb+tcOKQb9iYr1Mi3EePAOWG8fLtkFfrQwq22Go9vWcdR
N4RbXdgxjZ9POTap2hN8blVMYXkrVjP212JX9Ami/kuFI9kAA9WAGy5Je/P1sZWE
-----END CERTIFICATE REQUEST-----
sys crypto csr example.csr {
    admin-email-address
    challenge-password
    city Los Angeles
    common-name example.com
    country US
    email-address admin@example.com
    key-size 2048
    organization Internet Assigned Numbers Authority
    ou Information Technology
    public-key-type RSA
    state California
    subject-alternative-name DNS:example.com 
}
```
You can also verify the CSR from `https://ssltools.digicert.com/checker/views/csrCheck.jsp`.

3. To view the key associated with the CSR, do the following;
```
# list sys crypto key example.key
sys crypto key example.key {
    key-size 2048
    key-type rsa-private
    security-type normal
}
```
4. Save the configuration;
```
# save sys config
```
5.	Use `example.csr` to obtain the site certificate (example.crt) and intermediates (intermediate.crt) from Certificate Authority (CA).


#### B. Construct certificate chain
After you obtained the site cert and intermediates from the CA, add them in a single txt file in the following order;
```
-----BEGIN CERTIFICATE-----
Site Certificate
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
Intermediate Certificate
-----END CERTIFICATE-----
```
You can also check if your certificate chain is complete from `https://tools.keycdn.com/ssl`. 

You do not need to include the root certificate but if you have two intermediate CAs, then you have to add both in the certificate chain so that your site certificate can be validated using both certificate chain path.


#### C. Import the certificate to F5
1. To import the new certificate, do the following;
```
# tmsh
# install sys crypto cert example.crt from-editor
```
This command is equivalent to `vi example.crt`. Paste the new cert (full chain) and save.

2. Save the configuration;
```
# save sys config
```
3. To view the cert info, do the following;
```
# list sys crypto cert example.crt
sys crypto cert example.crt {
    cert-validation-options none
    cert-validators {
         { }
    }
    certificate-key-size 2048
    city Los Angels
    common-name example.com
    country US
    email-address
    expiration Jul 1 11:59:59 2020 GMT
    fingerprint SHA256/D5:DF:16:84:28:9E:F8:BF:C4:B3:FA:37:18:34:F3:E3:E0:81:CE:83:00:C1:C4:2F:67:6C:B7:E1:9B:AF:45:F1
    issuer CN=example.com,OU=Information Technology,O=Internet Assigned Numbers Authority,L=Los Angels,ST=CA,C=US
    issuer-certificate
    organization Internet Assigned Numbers Authority
    ou Information Technology
    public-key-type RSA
    state California
    subject-alternative-name DNS:example.com
}
```

---


### Renew SSL certificate using existing certificate/key

If you have obtained the site certificate (example.crt) and private key (example.key) without using CSR, then you can install the site certificate by following "Import Site Certificate" section above.

To import the private key, do the following;
```
# tmsh 
# install sys crypto key example.key from-editor

-----BEGIN RSA PRIVATE KEY-----
Cert Key
-----END RSA PRIVATE KEY-----
```
This command is equivalent to `vi example.key`. Paste the new key and save.

Save the configuration by running the following;
```
# save sys config
```

#### Verify certificate and key fingerprint
After you obtained the site certificate and private key, you can do the following to check the certificate/key fingerprint;
1. Go to the following location;
```
# cd /config/filestore/files_d/Common_d/certificate_d
```
2. To check the public key (.crt) information for a SSL certificate, run the following;
```
# openssl x509 -in \:Common\:example.crt_40746_1 -pubkey -noout | md5sum
c42a03ac6d61d8749d89668e71c5acaa
```
3. To check the public key information for a SSL private key (.key), run the following;
```
# openssl rsa -in \:Common\:example.key_40746_1 -pubkey | md5sum
c42a03ac6d61d8749d89668e71c5acaa
```
4. If both `2` and `3` yields the same `md5`, it validates that the key and certificate are same.

---

#### Renew F5 Device Certificate
To see current Device Certificate, go to `System > Certificate Management > Device Certificate Management > Device Certificate`.

To renew Device Certificate, do the following;
1. Go to Apache certificate crt file location of F5;
```
# cd /etc/httpd/conf/ssl.crt/
```
2. Take a backup of existing `server.crt`;
```
# mv server.crt server.crt.bak
```
3. Create a new `server.crt` file, paste the full certificate chain and save;
```
# vi server.crt
```
4. Go to Apache certificate crt file location of F5;
```
# cd /etc/httpd/conf/ssl.key/
```
5. Take a backup of existing `server.key`;
```
# mv server.key server.key.bak
```
6. Create a new `server.key` file, paste the key and save;
```
# vi server.key
```
7. Restart Apache;
```
# tmsh restart /sys service httpd
```
8. Check the device certificate;
```
# openssl s_client -connect f5.example.com:443 | openssl x509 -noout -text
depth=2 C = US, O = DigiCert Inc, OU = www.digicert.com, CN = DigiCert Global Root CA
verify return:1
depth=1 C = US, O = DigiCert Inc, CN = DigiCert SHA2 Secure Server CA
verify return:1
depth=0 C = US, ST = California, L = Los Angeles, O = Internet Corporation for Assigned Names and Numbers, OU = Technology, CN = www.example.org
verify return:1
```

