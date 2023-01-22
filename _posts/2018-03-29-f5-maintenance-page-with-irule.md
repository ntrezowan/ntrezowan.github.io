---
title: "F5 maintenance page with iRule"
comments: false
description: "F5 maintenance page with iRule"
keywords: "F5, iRules, iFile, redirect, HTML"
published: true
---
### Create maintenance page using HTML iFile
1.	Make sure in which partition you want to upload the html file. It will be easier if VIP, iRule and iFile are in the same partition.  

2.	Go to `System > File Management > iFile List`. Click on Import and upload your html file (maintenance.html) and give it a Name (maintenance.html).  

3.	Go to `Local Traffic > iRules > iFile List`. Click on Create, select the iFile you have just uploaded from File Name and give it a Name (maintenance.html).  

4.	Go to `Local Traffic > iRules > iRules List`. Create a new iRule and give it a Name (maintenance). Here is a sample iRule which will load the HTML page when all  pool members are down (this decision will be made based on `HTTP Profile` configuration);  
```
when LB_FAILED {
  if { [active_members [LB::server pool]] == 0 } {
  HTTP::respond 503 content [ifile get " maintenance.html"]}
  }
```

5.	Go to `Local Traffic > Virtual Servers > Virtual Servers List`. Select the VIP you want to apply iRule to and go to Resource Tab. In the iRule section, click on Manage, add the iRule and click Finished.  

NB: If your html file is in a different partition, then you have to use something like `/Common/maintenance.html` in the iRule. We are also using `503` because it will tell the search crawler not to cache this page.  

---
### Create redirection page if a URI is down without HTML iFile
1.	Go to `System > File Management > iFile List`. Click on import and upload your image (companylogo.png) and give it a Name (companylogo.png). You can also upload more files (such as css or js) to support your HTML template.  

2.	Go to `Local Traffic > iRules > iFile List`. Click on Create, select the iFile you have just uploaded from File Name and give it a Name (companylogo.png).  

3.	Go to `Local Traffic > iRules > iRules List`. Create a new iRule and give it a Name (maintenance). Here is a sample iRule which will load the html content and then redirect to another URI (`https://discovery.com`) when a user visits a particular URI;  
```
when HTTP_REQUEST {
    if { [HTTP::query] equals "providerId=https://www.example.com/" }{  
    HTTP::respond 200 content {

    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <title>Title goes here</title>
                <META http-equiv="refresh" content="15;URL=https://discovery.com">
            </head>
            <body>
                <div align="center">
                    <div id="maintenanceHeader" align="center">
                        <img src="companylogo.png"
                    </div>
                    <div id="maintenanceBody" align="center">
                        <strong>This site is in maintenance now.</strong>  
                        <br /><br />
                        You will be redirected to https://discovery.com automatically in 15 seconds.
                    </div>
                </div>
            </body>
        </html>
    }
  }
}
```

4.	Go to `Local Traffic > Virtual Servers > Virtual Servers List`. Select the VIP you want to apply iRule to and go to Resource Tab. In the iRule section, click on Manage, add the iRule and click Finished.  

NB: If you do not want to be redirected, remove `<META http-equiv="refresh" content="15;URL=https://discovery.com">` from head.

---
### Redirect based on HTTP Response 403/404/500
1.	Go to `System > File Management > iFile List`. Click on Import and upload html files (403.html, 404.html, 500.html). Name them according to their file name.  

2.	Go to `Local Traffic > iRules > iRules List`. Create a new iRule and give it a Name (redirect_403_404_500). Here is a sample iRule which will load the HTML page when the server sends HTTP Response of either 403, 404 or 500;  
```
when HTTP_RESPONSE {
    if { [HTTP::status] == 403 } {
    HTTP::respond 200 content [ifile get 403.html] 
    }
    elseif { [HTTP::status] == 404 } {
    HTTP::respond 200 content [ifile get 404.html]
    }
    elseif { [HTTP::status] == 500 } {
    HTTP::respond 200 content [ifile get 500.html]
    }
}
```

3.	Go to `Local Traffic > Virtual Servers > Virtual Servers List`. Select the VIP you want to apply iRule to and go to Resource Tab. In the iRule section, click on Manage, add the iRule and click Finished.  

---
To test if the iRule is working, visit http://example.com/a/b/c and it should load 404.html page.

