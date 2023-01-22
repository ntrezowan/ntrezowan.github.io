---
title: "Installing self-signed certificate in Windows Servers"
comments: false
description: "Installing self-signed certificate in Windows Servers"
keywords: "self-signed, ssl, certificate, create, windows, servers, IIS"
published: false
---

1. Open IIS from the server you want to install the certificate and click on `Server Certificates`;  
![Figure 1a](http://ntrezowan.github.com/images/self-signed-1.png)

2. Click on `Create Self-Signed Certificate`;  
![Figure 2](http://ntrezowan.github.com/images/self-signed-2.png)

3. Type the domain name for the certificate and click OK;  
![Figure 3](http://ntrezowan.github.com/images/self-signed-3.png)

4. Verify if the self-signed certificate is created;  
![Figure 4](http://ntrezowan.github.com/images/self-signed-4.png)

5. Open Run, type `mmc` and click OK;  
![Figure 5](http://ntrezowan.github.com/images/self-signed-5.png)

6. From MMC console, go to `File > Add/Remove Snap-in` which will open Add or Remove Snap-ins window;  
![Figure 6](http://ntrezowan.github.com/images/self-signed-6.png)

7. Double click on `Certificates` from Available snap-ins;  
![Figure 7](http://ntrezowan.github.com/images/self-signed-7.png)

8. It will open Certificate snap-ins, select `Computer account`, and click Next;  
![Figure 8](http://ntrezowan.github.com/images/self-signed-8.png)

9. Keep the default snap-in manage option and click Finish;  
![Figure 9](http://ntrezowan.github.com/images/self-signed-9.png)

10. From MMC, copy the newly created certificate from `Certificates > Personal > Certificates` to `Console Root > Certificates > Trusted People > Certificates`;  
![Figure 10a](http://ntrezowan.github.com/images/self-signed-10a.png)
![Figure 10b](http://ntrezowan.github.com/images/self-signed-10b.png)

11. Go to `IIS Manager > Server > Default Web Site > Edit Binding`;  
![Figure 11](http://ntrezowan.github.com/images/self-signed-11.png)

12. Select Type `HTTPS` and click Edit;  
![Figure 12](http://ntrezowan.github.com/images/self-signed-12.png)

13. Type the domain name in Host name/Host header, choose the new SSL certificate and click OK. You can also verify the certificate by clicking View;  
![Figure 13](http://ntrezowan.github.com/images/self-signed-13.png)
