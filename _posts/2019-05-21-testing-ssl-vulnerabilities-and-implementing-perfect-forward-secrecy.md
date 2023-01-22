---
title: "Testing SSL Vulnerabilities and Implementing PFS"
comments: false
description: "Testing SSL Vulnerabilities and Implementing Perfect Forward Secrecy (PFS)"
keywords: "testing, ssl, vulnerabilities, implementing, perfect, forward, secrecy, pfs"
published: true
---

### A. Testing SSL vulnerabilities

1.	View a web server certificate  
```
    # openssl s_client -connect example.com:443
    
    CONNECTED(00000003)
    depth=2 /C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
    verify error:num=19:self signed certificate in certificate chain
    verify return:0
    ---
    Certificate chain
     0 s:/C=US/ST=California/L=Los Angeles/O=Internet Corporation for Assigned Names and Numbers/OU=Technology/CN=www.example.org
       i:/C=US/O=DigiCert Inc/CN=DigiCert SHA2 Secure Server CA
     1 s:/C=US/O=DigiCert Inc/CN=DigiCert SHA2 Secure Server CA
       i:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
     2 s:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
       i:/C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
    ---
    Server certificate
    -----BEGIN CERTIFICATE-----
    MIIHQDCCBiigAwIBAgIQD9B43Ujxor1NDyupa2A4/jANBgkqhkiG9w0BAQsFADBN
    MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMScwJQYDVQQDEx5E
    aWdpQ2VydCBTSEEyIFNlY3VyZSBTZXJ2ZXIgQ0EwHhcNMTgxMTI4MDAwMDAwWhcN
    MjAxMjAyMTIwMDAwWjCBpTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3Ju
    aWExFDASBgNVBAcTC0xvcyBBbmdlbGVzMTwwOgYDVQQKEzNJbnRlcm5ldCBDb3Jw
    b3JhdGlvbiBmb3IgQXNzaWduZWQgTmFtZXMgYW5kIE51bWJlcnMxEzARBgNVBAsT
    ClRlY2hub2xvZ3kxGDAWBgNVBAMTD3d3dy5leGFtcGxlLm9yZzCCASIwDQYJKoZI
```

2.	Check which SSL/TLS protocols are enabled on a web server <br/><br/>
To see if the web server supports a particular protocol (e.g. TLSv1), run the following;  
```
    # openssl s_client –tls1 -connect example.com:443

    CONNECTED(00000003)
    2666:error:14094410:SSL routines:SSL3_READ_BYTES:sslv3 alert handshake failure:/BuildRoot/Library/Caches/com.apple.xbs/Sources/OpenSSL098/OpenSSL098-64.50.7/src/ssl/s3_pkt.c:1145:SSL alert number 40
    2666:error:1409E0E5:SSL routines:SSL3_WRITE_BYTES:ssl handshake failure:/BuildRoot/Library/Caches/com.apple.xbs/Sources/OpenSSL098/OpenSSL098-64.50.7/src/ssl/s3_pkt.c:566:
```
If it returns the above, it means the web server does not support TLSv1 protocol.  
But if it returns the following, then it means the web server supports TLSv1 protocol;
```
    # openssl s_client –tls1 -connect example.com:443
    
    CONNECTED(00000003)
    depth=2 /C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert Global Root CA
    verify error:num=19:self signed certificate in certificate chain
    verify return:0
    ---
    Certificate chain
```

3.	List all cipher suites supported by a web server <br/><br/>
There are two tools which can show which cipher suites are supported by a web server; sslscan and nmap.<br/><br/>
_**sslscan**_ (https://github.com/rbsec/sslscan):  
To see all the Preferred/Accepted cipher suites by a web server;
```
    # sslscan example.com | egrep "Preferred|Accepted"
    
    Preferred TLSv1.2  128 bits  ECDHE-RSA-AES128-GCM-SHA256   Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-GCM-SHA384   Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  ECDHE-RSA-AES128-SHA256       Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  ECDHE-RSA-AES128-SHA          Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-SHA384       Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-SHA          Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  AES128-GCM-SHA256
    Accepted  TLSv1.2  256 bits  AES256-SHA
    Accepted  TLSv1.2  256 bits  CAMELLIA256-SHA
    Accepted  TLSv1.2  128 bits  AES128-SHA
    Accepted  TLSv1.2  128 bits  CAMELLIA128-SHA
    Accepted  TLSv1.2  128 bits  SEED-SHA
    Preferred TLSv1.1  128 bits  ECDHE-RSA-AES128-SHA          Curve P-256 DHE 256
    Accepted  TLSv1.1  256 bits  ECDHE-RSA-AES256-SHA          Curve P-256 DHE 256
    Accepted  TLSv1.1  256 bits  AES256-SHA
    Accepted  TLSv1.1  256 bits  CAMELLIA256-SHA
    Accepted  TLSv1.1  128 bits  AES128-SHA
    Accepted  TLSv1.1  128 bits  CAMELLIA128-SHA
    Accepted  TLSv1.1  128 bits  SEED-SHA
    Preferred TLSv1.0  128 bits  ECDHE-RSA-AES128-SHA          Curve P-256 DHE 256
    Accepted  TLSv1.0  256 bits  ECDHE-RSA-AES256-SHA          Curve P-256 DHE 256
    Accepted  TLSv1.0  256 bits  AES256-SHA
    Accepted  TLSv1.0  256 bits  CAMELLIA256-SHA
    Accepted  TLSv1.0  128 bits  AES128-SHA
    Accepted  TLSv1.0  128 bits  CAMELLIA128-SHA
    Accepted  TLSv1.0  128 bits  SEED-SHA
```
_**nmap**_ (https://nmap.org/):  
To see all the TLS cipher suites that are supported by a web server;
```
    # nmap -sV --script ssl-enum-ciphers -p 443 example.com | grep -i TLS*
    
    |   TLSv1.0:
    |       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (secp256r1) - A
    |       TLS_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_CAMELLIA_256_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_CAMELLIA_128_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_SEED_CBC_SHA (rsa 2048) - A
    |   TLSv1.1:
    |       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (secp256r1) - A
    |       TLS_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_CAMELLIA_256_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_CAMELLIA_128_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_SEED_CBC_SHA (rsa 2048) - A
    |   TLSv1.2:
    |       TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256 (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384 (secp256r1) - A
    |       TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA (secp256r1) - A
    |       TLS_RSA_WITH_AES_128_GCM_SHA256 (rsa 2048) - A
    |       TLS_RSA_WITH_AES_256_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_CAMELLIA_256_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_AES_128_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_CAMELLIA_128_CBC_SHA (rsa 2048) - A
    |       TLS_RSA_WITH_SEED_CBC_SHA (rsa 2048) – A
```
In here, `A` is a grade which indicates the strength of the cipher.

4. Check if a web server certificate chain has any issues
Run the following;
```
    # openssl s_client -connect example.com:443
    ...
    ...
    SSL-Session:
        Protocol  : TLSv1
        Cipher    : AES256-SHA
        Session-ID: 5CB34B1CE1D0390047899FD91558E13FE6BBCA836839CA1705F2177B97624BC1
        Session-ID-ctx:
        Master-Key: ED54539CF33A477D8298B13D7F61D92CF63F19E9FEE15DEE38F4D215AFD0B99D35459C456FB9D4CA82813DB70286707A
        Key-Arg   : None
        Start Time: 1565368406
        Timeout   : 300 (sec)
        Verify return code: 0 (ok)
```
If it returns `Verify return code: 0 (ok)` at the end of the output, then it indicates that there is no certificate chain issue with this web server.

5.	Check if renegotiation is enabled <br/><br/>
SSL protocol that allows server/client to renegotiate new encryption key during an existing session will create a vulnerability by exploiting the flaw in the renegotiation process. <br/><br/>
a.	Check if server renegotiation is allowed;  
Run the following to check if renegotiation is enabled in a web server;
```
    # openssl s_client -connect example.com:443
```
If it returns `Secure Renegotiation IS supported` like the following, then it means the server allows key renegotiation;
```
    New, TLSv1/SSLv3, Cipher is AES256-SHA
    Server public key is 2048 bit
    Secure Renegotiation IS supported
    Compression: NONE
    Expansion: NONE
```
If it does not support key renegotiation, then you will get the following;
```
    New, TLSv1/SSLv3, Cipher is ECDHE-RSA-AES128-GCM-SHA256
    Server public key is 2048 bit
    Secure Renegotiation IS NOT supported
    Compression: NONE
    Expansion: NONE
```
b.	Check client renegotiation is allowed;  
To test if you site supports client-initiated renegotiation, run the following;
```
    # openssl s_client -connect example.com:443
    ...
    ...
    New, TLSv1/SSLv3, Cipher is AES256-SHA
    Server public key is 2048 bit
    Secure Renegotiation IS supported
    Compression: NONE
    Expansion: NONE
    SSL-Session:
        Protocol  : TLSv1
        Cipher    : AES256-SHA
        Session-ID: 5CB34B1CE1D0390047899FD91558E13FE6BBCA836839CA1705F2177B97624BC1
        Session-ID-ctx:
        Master-Key: ED54539CF33A477D8298B13D7F61D92CF63F19E9FEE15DEE38F4D215AFD0B99D35459C456FB9D4CA82813DB70286707A
        Key-Arg   : None
        Start Time: 1565368406
        Timeout   : 300 (sec)
        Verify return code: 0 (ok)
    ---
```
At this point, type the following two line and press `Enter`;
```
    HEAD / HTTP/1.0
    R
```
If your site supports client-initiated renegotiation, then you will see the following;
```
    RENEGOTIATING
    depth=3 C = SE, O = AddTrust AB, OU = AddTrust External TTP Network, CN = AddTrust External CA Root
    verify return:1
    depth=2 C = GB, ST = Greater Manchester, L = Salford, O = COMODO CA Limited, CN = COMODO RSA Certification Authority
    verify return:1
```
If your site does not support client-initiated renegotiation, then you will see the following;
```
    HEAD / HTTP/1.0
    R
    RENEGOTIATING
    write:errno=104
```
6.	Check if TLS compression is enabled <br/><br/>
Run the following;
```
    # openssl s_client -connect example.com:443
    ...
    ...
    New, TLSv1/SSLv3, Cipher is AES256-SHA
    Server public key is 2048 bit
    Secure Renegotiation IS supported
    Compression: zlib compression
    Expansion: NONE
    SSL-Session:
        Protocol  : TLSv1
        Cipher    : AES256-SHA
        Session-ID: 101A5E9F6A5DF484B5D7E0D7D9FD288A3E852C53E148CC8489F72993D8643C72
        Session-ID-ctx:
        Master-Key: 20F51322F08487907DFF0AB3842095E346F5FAC27863F3ECD0F76D023FF1FE67BE9CA72E03B120EC39DA79B598EB87C1
        Key-Arg   : None
        Start Time: 1565373289
        Timeout   : 300 (sec)
        Verify return code: 0 (ok)
    ---
```
If you see the above, then it means compression is enabled and it is using zlib data compression.  
But if you see the following, then it means compression is disabled;
```
    # openssl s_client -connect example.com:443
    ...
    ...
    New, TLSv1/SSLv3, Cipher is AES256-SHA
    Server public key is 2048 bit
    Secure Renegotiation IS supported
    Compression: NONE
    Expansion: NONE
    SSL-Session:
        Protocol  : TLSv1
        Cipher    : AES256-SHA
        Session-ID: 101A5E9F6A5DF484B5D7E0D7D9FD288A3E852C53E148CC8489F72993D8643C72
        Session-ID-ctx:
        Master-Key: 20F51322F08487907DFF0AB3842095E346F5FAC27863F3ECD0F76D023FF1FE67BE9CA72E03B120EC39DA79B598EB87C1
        Key-Arg   : None
        Start Time: 1565373289
        Timeout   : 300 (sec)
        Verify return code: 0 (ok)
    ---
```

---

### B. Implementing Perfect Forward Secrecy
#### Configure Apache with PFS
1. Find all vhosts where SSL is configured;
```
# egrep -r "SSLEngine" /etc/httpd/
```
2. Modify each vhost to the following;
```
    # Only allow TLSv1.2 and TLSv1.3
    SSLProtocol "-all +TLSv1.2 +TLSv1.3"

    # Choose cipher suites which allows Perfect Forward Secrecy
    SSLCipherSuite "EECDH+ECDSA+AESGCM EECDH+aRSA+AESGCM EECDH+ECDSA+SHA384 EECDH+ECDSA+SHA256 EECDH+aRSA+SHA384 EECDH+aRSA+SHA256 EECDH+aRSA+RC4 EECDH EDH+aRSA RC4 !aNULL !eNULL !LOW !3DES !MD5 !EXP !PSK !SRP !DSS !RC4 !SHA !DHE"

    # Instead of client preference of the cipher suite during handshake, server’s preference will be used 
    SSLHonorCipherOrder on

    # Disable Session Tickets
    SSLSessionTickets off
```
3. Restart httpd;
```
    # /sbin/services httpd restart
```

4. Check supported cipher suites on the web server;
```
    # sslscan serv1.example.com:443

    Preferred TLSv1.2  128 bits  ECDHE-RSA-AES128-GCM-SHA256   Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-GCM-SHA384   Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  ECDHE-RSA-AES128-SHA256       Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-SHA384       Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  AES128-GCM-SHA256
    Accepted  TLSv1.2  128 bits  AES128-SHA256
    Accepted  TLSv1.2  256 bits  AES256-GCM-SHA384
    Accepted  TLSv1.2  256 bits  AES256-SHA256
```

#### Configure F5 Virtual Servers with PFS
1. Go to `Local Traffic > Profiles > SSL > Clients` and open the client SSL profile where you want to implement PFS. Select `Configuration` as `Advanced`, select `Ciphers` as `Custom` and then use the following string;
```
    ECDHE+AES-GCM:NATIVE:!MD5:!EXPORT:!DES:!DHE:!EDH:!RC4:!ADH:!SSLv3:!TLSv1:!SHA
```
2. Check supported cipher suites on the VIP;
```
    # sslscan example.com:443

    Preferred TLSv1.2  128 bits  ECDHE-RSA-AES128-GCM-SHA256   Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-GCM-SHA384   Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  ECDHE-RSA-AES128-SHA256       Curve P-256 DHE 256
    Accepted  TLSv1.2  256 bits  ECDHE-RSA-AES256-SHA384       Curve P-256 DHE 256
    Accepted  TLSv1.2  128 bits  AES128-GCM-SHA256
    Accepted  TLSv1.2  128 bits  AES128-SHA256
    Accepted  TLSv1.2  256 bits  AES256-GCM-SHA384
    Accepted  TLSv1.2  256 bits  AES256-SHA256
```
