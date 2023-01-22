---
title: "Upgrading Broadcom Automic Automation"
comments: false
description: "Upgrading Automic Automation"
keywords: "upgrade, automic, automation, engine, workload, 12.3. ca, broadcom"
published: true

---

### A. Preparation before upgrade 
1. Backup `Automic Utility` and extract new JAR;
```
# rm -rf /opt/ae/utility/bin_new/*
# rm -rf /opt/ae/utility/bin_old/*
# cp -r /opt/ae/utility/bin/* /opt/ae/utility/bin_old/
# cp /opt/iso/Automic.Automation_12.3.0_HF1/Automation.Platform/Utility/unix/linux/x64/utillx6.tar.gz /opt/ae/utility/bin_new
# tar -zxvf utillx6.tar.gz
```
In here, we are only interested of `bin` folder and `db` folder should be empty.

2. Backup `Automic DB` and extract new JAR;
```
# rm -rf /opt/ae/utility/db_new/*
# rm -rf /opt/ae/utility/db_old/*
# cp -r /opt/ae/utility/db/* /opt/ae/utility/db_old/
# cp /opt/iso/Automic.Automation_12.3.0_HF1/Automation.Platform/db/db.tar.gz /opt/ae/utility/db_new
# tar -zxvf db.tar.gz
```

3. Backup `Automation Engine` and extract new JAR;
```
# rm -rf /opt/ae/automationengine/bin_new/*
# rm -rf /opt/ae/automationengine/bin_old/*
# cp -r /opt/ae/automationengine/bin/* /opt/ae/automationengine/bin_old/
# cp /opt/iso/Automic.Automation_12.3.0_HF1/Automation.Platform/AutomationEngine/unix/linux/x64/ucslx6.tar.gz /opt/ae/automationengine/bin_new/
# tar -zxvf ucslx6.tar.gz
```

4. Backup `Service Manager` and extract new JAR;
```
# rm -rf /opt/ae/servicemanager/bin_new/*
# rm -rf /opt/ae/servicemanager/bin_old/*
# cp -r /opt/ae/servicemanager/bin/* /opt/ae/servicemanager/bin_old/
# cp /opt/iso/Automic.Automation_12.3.0_HF1/Automation.Platform/ServiceManager/unix/linux/x64/ucsmgrlx6.tar.gz /opt/ae/servicemanager/bin_new/
# tar -zxvf ucsmgrlx6.tar.gz
```

5. Create folder for `CAPKI` and copy the installer;  
Download CAPKI installer from [https://downloads.automic.com/downloads](https://downloads.automic.com/downloads) and move it to the server.
```
# mkdir /opt/ae/capki/
# cp /opt/iso/CA.PKI/unix/linux/x64/setup /opt/ae/capki/
```

6. Shutdown AE;
```
# ps -ef | grep ucybsmgr
# kill pid
```

7. Check environment;  

    a) Check Java version;  

    Automation Engine supports `OpenJDK Java 11`, `Oracle Java 1.8` and `Oracle Java 11`. Check if you have proper version of Java;

        # java -version
        openjdk version "11.0.4" 2019-07-16 LTS
        OpenJDK Runtime Environment 18.9 (build 11.0.4+11-LTS)
        OpenJDK 64-Bit Server VM 18.9 (build 11.0.4+11-LTS, mixed mode, sharing)

    b) Check environment variables;  

        # vi ~/.bashrc

        # AUTOMIC System Settings
        ORACLE_HOME=/opt/oracle/product/12.2.0.1/dbhome_1; export ORACLE_HOME
        AUTOMIC=/opt/ae/utility; export AUTOMIC
        PATH=.:$ORACLE_HOME/bin[:$PATH]; export PATH
        LD_LIBRARY_PATH=.:${AUTOMIC}/bin:$ORACLE_HOME/lib:/usr/lib:/lib[:$LD_LIBRARY_PATH]; export LD_LIBRARY_PATH
        TNS_ADMIN=/opt/oracle/product/12.2.0.1/dbhome_1/network/admin; export TNS_ADMIN
        CLASSPATH=${ORACLE_HOME}/jdbc/lib/:${ORACLE_HOME}/jlib/; export CLASSPATH


---

### B. Upgrade Automation Engine

1. Upgrade Automic Utility;  

    a) Upgrade Automic Utility `bin` folder;  

        # cp -r /opt/ae/utility/bin_new/bin/* /opt/ae/utility/bin/

    Check if all the files are owned by `autotask` user and `autotask` group.

    b) Check config files;  
    All config file will not be replaced when we upgraded Automic Utility bin folder. These `INI` files have OCI DB connection string defined and you should verify the following files;

        AE.DB Archive: ucybdbar.ini
        AE.DB Client Copy: ucybdbcc.ini
        AE.DB Load: ucybdbld.ini
        AE.DB Reorg: ucybdbre.ini
        AE.DB Reporting Tool: ucybdbrt.ini
        AE.DB Revision Report: ucybdbrr.ini
        AE.DB Unload: ucybdbun.ini

    The `UID` should be in all capital.

    c) Check `ucybdbar.sh` execute permission;

        # ll ucybdbar.sh
        -rwxr-xr-x 1 autotask autotask 27 Sep  5 12:55 ucybdbar.sh

    If it does not have execute permission, set the permission;

        # chmod +x ucybdbar.sh

2. Upgrade AE DB scheme;

    a) Upgrade `db` folder;

        # cp -r /opt/ae/utility/db_new/* /opt/ae/utility/db/

    Check if all the files are owned by `autotask` user and `autotask` group

    b) Start AE DB Load;

        # cd /opt/ae/utility/bin
        # ./ucybdbld -B -X/opt/ae/utility/db/general/12.3/UC_UPD.TXT

        ========================================================
        Starting C++ batch mode loader...
        User account (user/domain) <AUTOTASK/>
        Startup parameter <-B -X/opt/ae/utility/db/general/12.3/UC_UPD.TXT >
        Application name <./ucybdbld>
        Launch from </opt/ae/utility/bin/>
        LoadLibrary pointer = <0x1b882d0>
        20190905/134647.081 - U00033125 Operating System: <UC4_ON_UNIX>
        20190905/134647.081 - U00033125 Operating System: <UC4_ON_UNIX_LINUX>
        20190905/134647.081 - U00038002 DLL 'ucybdbld', version '12.3.0+build.1560517368775'. Start parameter: '-B -X/opt/ae/utility/db/general/12.3/UC_UPD.TXT ', (changelist '1560507727').
        20190905/134647.081 - U00038259 Build Date: '2019-06-14', '15:07:38'
        20190905/134647.092 - ----------------------------------------------------------------------------------------------------
        20190905/134647.092 - [GLOBAL]
        20190905/134647.092 - language  = (E,D)
        20190905/134647.092 - logging   = ../temp/ucybdbld_log_##.txt
        20190905/134647.092 - logcount  = 10
        20190905/134647.092 - helplib   = uc.msl
        20190905/134647.092 - helpcache = ALL
        20190905/134647.092 - docu_path = ../../Docu/uc4/webhelp
        20190905/134647.092 - input     = ../db/
        …
        …
        20190911/131253.733 - U00003532 UCUDB: Checking data source ...
        20190911/131257.706 - U00003533 UCUDB: Check of data source finished: No errors. Performance CPU/DB: '1842013'/'369 (1000/2.706869 s)'
        20190911/131257.706 - U00003544 UCUDB: Reference values tested with Windows 2003 on XEON 1500 MHz: CPU 813865, DB 470
        20190911/131257.706 - U00003525 UCUDB: ===> ''
        20190911/131257.707 - U00038091 Change application directory to '../db/'.
        20190911/131257.707 - U00038042 DB-Version = 12.3/R
        20190911/131257.731 - U00038084 Processing completed. Caution: If you use two or more users, you have to renew the roles of the AE user (privileges) and the synonyms.
        20190911/131257.736 - U00003523 UCUDB: Maximum time required for a DB call: '4:047.702.000'.
        20190911/131257.736 - U00003522 UCUDB: Database closed. Total time for DB calls: '4:075.260.999' seconds.
        20190911/131257.736 - U00003549 UCUDB: '            2026' 'OTHERS    ' calls took '0:002.766.000' sec.
        20190911/131257.736 - U00003549 UCUDB: '               3' 'SELECT    ' calls took '0:008.211.000' sec.
        20190911/131257.736 - U00003549 UCUDB: '               5' 'EXECUTE   ' calls took '4:059.009.999' sec.
        20190911/131257.736 - U00003549 UCUDB: '               0' 'UPDATE    ' calls took '0:000.000.000' sec.
        20190911/131257.736 - U00003549 UCUDB: '               0' 'DELETE    ' calls took '0:000.000.000' sec.
        20190911/131257.736 - U00003549 UCUDB: '               0' 'INSERT    ' calls took '0:000.000.000' sec.
        20190911/131257.736 - U00003549 UCUDB: '               3' 'READ      ' calls took '0:000.047.999' sec.
        20190911/131257.736 - U00003549 UCUDB: '            3025' 'CLOSESTMT ' calls took '0:000.052.000' sec.
        20190911/131257.736 - U00003549 UCUDB: '            1014' 'TRANSACT  ' calls took '0:005.173.999' sec.
        Application return code = 0
    
    If `return code = 0`, then it means AE DB has been upgraded successfully.
    
    c) Load Rapid Automation to DB;

        # java -jar ./ucybdbld.jar -B -X/opt/iso/Automic.Automation_12.3.0_HF1/Rapid.Automation/RA.FTP/FtpAgent_solution.jar

        20191106/120923.533 - U00038162 Loading file: '/opt/iso/Automic.Automation_12.3.0_HF1/Rapid.Automation/RA.FTP/FtpAgent_solution.jar'.
        20191106/120923.661 - U00038163 File '/opt/iso/Automic.Automation_12.3.0_HF1/Rapid.Automation/RA.FTP/FtpAgent_solution.jar' successfully loaded.
        20191106/120923.701 - U00038165 RA Solution loaded successfully.
        20191106/120923.701 - U00038272 Loading RA Plugins.
        20191106/120923.702 - U00038269 Version check result:
        Version of the RA Plugins: '4.0.7'.
        Version of database objects: '12.3.0+hf.1.build.1565956991091'.

3. Upgrade Automation Engine;

    a) Upgrade Automation Engine `bin` folder;
    
        # cp -r /opt/ae/automationengine/bin_new/bin/* /opt/ae/automationengine/bin/
        
    Check if all the files are owned by `autotask` user and `autotask` group.

    b) Check `CP` libraries;
    
        # cd /opt/ae/automationengine/bin/
        # ldd -r ucsrvcp > wk.txt
        # cat wk.txt
        linux-vdso.so.1 =>  (0x00007ffd88724000)
        libzu00132.so => ./libzu00132.so (0x00007fe425490000)
        libucmsgq.so => ./libucmsgq.so (0x00007fe425259000)
        libucudb32.so => ./libucudb32.so (0x00007fe425008000)
        libuccache.so => ./libuccache.so (0x00007fe424dfb000)
        libsysapi.so => ./libsysapi.so (0x00007fe424bf6000)
        libzusynchk.so => ./libzusynchk.so (0x00007fe4249e9000)
        libuc001.so => ./libuc001.so (0x00007fe4247e4000)
        libzugss.so => ./libzugss.so (0x00007fe4245cc000)
        libzukms.so => ./libzukms.so (0x00007fe4243c6000)
        libpthread.so.0 => /lib64/libpthread.so.0 (0x0000003167e00000)
        libdl.so.2 => /lib64/libdl.so.2 (0x0000003167a00000)
        libstdc++.so.6 => ./libstdc++.so.6 (0x00000031cfa00000)
        libm.so.6 => /lib64/libm.so.6 (0x0000003168600000)
        libgcc_s.so.1 => ./libgcc_s.so.1 (0x00000031cf600000)
        libc.so.6 => /lib64/libc.so.6 (0x0000003167600000)
        librt.so.1 => /lib64/librt.so.1 (0x0000003168200000)
        /lib64/ld-linux-x86-64.so.2 (0x0000556b5c1be000)

    c) Check `WP` libraries;
    
        # cd /opt/ae/automationengine/bin/
        # ldd -r ucsrvwp > wk.txt
        # cat wk.txt
        linux-vdso.so.1 =>  (0x00007ffccdf97000)
        libucsj.so => ./libucsj.so (0x00007f4b61277000)
        libucdsfun.so => ./libucdsfun.so (0x00007f4b60ec7000)
        libucucc.so => ./libucucc.so (0x00007f4b60cb5000)
        libucuhg.so => ./libucuhg.so (0x00007f4b60a8f000)
        libucrtl.so => ./libucrtl.so (0x00007f4b60886000)
        libzuxml.so => ./libzuxml.so (0x00007f4b60664000)
        libucldap.so => ./libucldap.so (0x00007f4b60443000)
        libucexith.so => ./libucexith.so (0x00007f4b6023f000)
        libucuhsta.so => ./libucuhsta.so (0x00007f4b60032000)
        libucsmtp.so => ./libucsmtp.so (0x00007f4b5fe28000)
        libucumqa.so => ./libucumqa.so (0x00007f4b5fbb6000)
        libucqert.so => ./libucqert.so (0x00007f4b5f99e000)
        libucumulti.so => ./libucumulti.so (0x00007f4b5f798000)
        libzu00132.so => ./libzu00132.so (0x00007f4b5f566000)
        libucmsgq.so => ./libucmsgq.so (0x00007f4b5f330000)
        libucudb32.so => ./libucudb32.so (0x00007f4b5f0df000)
        libuccache.so => ./libuccache.so (0x00007f4b5eed1000)
        libsysapi.so => ./libsysapi.so (0x00007f4b5eccd000)
        libzusynchk.so => ./libzusynchk.so (0x00007f4b5eac0000)
        libuc001.so => ./libuc001.so (0x00007f4b5e8ba000)
        libzugss.so => ./libzugss.so (0x00007f4b5e6a3000)
        libzukms.so => ./libzukms.so (0x00007f4b5e49d000)
        libpthread.so.0 => /lib64/libpthread.so.0 (0x0000003167e00000)
        libdl.so.2 => /lib64/libdl.so.2 (0x0000003167a00000)
        libstdc++.so.6 => ./libstdc++.so.6 (0x00000031cfa00000)
        libm.so.6 => /lib64/libm.so.6 (0x0000003168600000)
        libgcc_s.so.1 => ./libgcc_s.so.1 (0x00000031cf600000)
        libc.so.6 => /lib64/libc.so.6 (0x0000003167600000)
        librt.so.1 => /lib64/librt.so.1 (0x0000003168200000)
        /lib64/ld-linux-x86-64.so.2 (0x0000562aa7289000)

    d) Check `DB` libraries;
    
        # cd /opt/ae/automationengine/bin/
        # ldd -r ucuoci.so > wk.txt
        # cat wk.txt
        linux-vdso.so.1 =>  (0x00007ffe7b5f1000)
        libsysapi.so => ./libsysapi.so (0x00007f4c178e1000)
        libzu00132.so => ./libzu00132.so (0x00007f4c176af000)
        libuc001.so => ./libuc001.so (0x00007f4c174aa000)
        libclntsh.so.12.1 => /opt/oracle/product/12.2.0.1/dbhome_1/lib/libclntsh.so.12.1 (0x00007f4c139f9000)
        libdl.so.2 => /lib64/libdl.so.2 (0x00007f4c137e8000)
        libpthread.so.0 => /lib64/libpthread.so.0 (0x00007f4c135cb000)
        libstdc++.so.6 => ./libstdc++.so.6 (0x00007f4c133db000)
        libm.so.6 => /lib64/libm.so.6 (0x00007f4c13156000)
        libgcc_s.so.1 => ./libgcc_s.so.1 (0x00007f4c13049000)
        libc.so.6 => /lib64/libc.so.6 (0x00007f4c12cb5000)
        librt.so.1 => /lib64/librt.so.1 (0x00007f4c12aac000)
        libmql1.so => /opt/oracle/product/12.2.0.1/dbhome_1/lib/libmql1.so (0x00007f4c12835000)
        libipc1.so => /opt/oracle/product/12.2.0.1/dbhome_1/lib/libipc1.so (0x00007f4c123f9000)
        libnnz12.so => /opt/oracle/product/12.2.0.1/dbhome_1/lib/libnnz12.so (0x00007f4c11cb0000)
        libons.so => /opt/oracle/product/12.2.0.1/dbhome_1/lib/libons.so (0x00007f4c11a62000)
        libnsl.so.1 => /lib64/libnsl.so.1 (0x00007f4c11848000)
        libaio.so.1 => /lib64/libaio.so.1 (0x00007f4c11647000)
        libresolv.so.2 => /lib64/libresolv.so.2 (0x00007f4c1142d000)
        /lib64/ld-linux-x86-64.so.2 (0x000055b48bc43000)
        libclntshcore.so.12.1 => /opt/oracle/product/12.2.0.1/dbhome_1/lib/libclntshcore.so.12.1 (0x00007f4c10e5e000)

    e) Start a `CP`;
    
        # cd /opt/ae/automationengine/bin/
        # ./ucsrvcp &

        UC4 CP-Server Version 12.3.0+hf.1.build.1565007573762 (PID=57961)

    Check if `CP` has started;
    
        # ps -ef | grep ucsrvcp

    Check log;
    
        # cat /opt/ae/automationengine/temp/CPsrv_log_001_00.txt

    f) Start a `WP`;
    
        # cd /opt/ae/automationengine/bin/
        # ./ucsrvwp &

        UC4 WP-Server Version 12.3.0+hf.1.build.1565007573762 (PID=58630)

        # SERVER=AE#WP001
        *** PRIMARY(AE#WP001) ***

    Check if `WP` has started;
    
        # ps -ef | grep ucsrvwp

    Check log;
    
        # cat /opt/ae/automationengine/temp/WPsrv_log_001_00.txt

    g) Stop CP/WP processes;

        # ps -ef | grep ucsrvcp
        # kill pid

        # ps -ef | grep ucsrvwp
        # kill pid

4. Upgrade Service Manager;

    a) Upgrade Service Manager `bin` folder;

        # cp -r /opt/ae/servicemanager/bin_new/bin/* /opt/ae/servicemanager/bin/

    Check if all the files are owned by `autotask` user and `autotask` group.

    b) Start Service Manager;

        # cd /opt/ae/servicemanager/bin/
        # nohup ./ucybsmgr &

    Check if Service Manager has started;
    
        # ps -ef | grep ucybsmgr

    Check logs;

        # cat /opt/ae/servicemanager/temp/SMgr_log_00.txt

5. Install JWP;

    a) Remove the following content so that AE `lib` and `plugins` folder are empty;

        # rm /opt/ae/automationengine/bin/lib/*
        # rm /opt/ae/automationengine/bin/plugins/*

    b) Copy new content of `lib` and `plugins` to AE;

        # cp /opt/ae/automationengine/bin_new/bin/lib/* /opt/ae/automationengine/bin/lib/

    It will copy `org.eclipse.osgi.jar` file only.

        # cp /opt/ae/automationengine/bin_new/bin/plugins/* /opt/ae/automationengine/bin/plugins/

    c) Copy `xdb6.jar` and `xmlparserv2.jar` to the lib folder to ensure that XML variables can be processed correctly;

        # cp /opt/oracle/product/12.2.0.1/dbhome_1/sqldeveloper/modules/oracle.xdk/xmlparserv2.jar /opt/ae/automationengine/bin/lib/
        # cp /opt/oracle/product/12.2.0.1/dbhome_1/sqldeveloper/rdbms/jlib/xdb6.jar /opt/ae/automationengine/bin/lib/

    d) Copy `ojdbc8.jar` from Oracle to AE `lib` folder;
    
        # cp /opt/oracle/product/12.2.0.1/dbhome_1/jdbc/lib/ojdbc8.jar /opt/ae/automationengine/bin/lib/

    e)	Install LDAP certificate if you want `OUD/LDAP` for authentication;

    By default, JWP uses Java keystore `cacerts`. To directly install LDAP certificate;

        # telnet ldap.example.com 636
        # cd $JAVA_HOME/jre/lib/security/
        # cp cacerts cacerts.backup
        # cd /opt/ae/automationengine/bin/
        # java -jar ucsrvjp.jar -installcert ldap.example.com:636

        Loading KeyStore /$JAVA_HOME/jre/lib/security/cacerts...
        Opening connection to ldap.example.com:636...
        Starting SSL handshake...

        No errors, certificate installed.

    Verifiy that the certificate has installed correctly;
    
        # keytool -list -v -keystore $JAVA_HOME/jre/lib/security/cacerts -alias "ldap" | more
    
    You may also need to install the intermediate certificate if it is missing in `cacerts`.

    If you prefer to create a new keystore and use it for JWP, do the following;
    
        # cd /opt/ae/automationengine/bin/
        # java -jar ucsrvjp.jar -installcert ldap.example.com:636 /opt/ae/automationengine/bin/ssl_certs/ldap.jks

    f) Configure the Database;

    If you prefer to use `Oracle OCI`, configure AE as following;

        # vi /opt/ae/automationengine/bin/ucsrv.ini

        [OCI]
        SQLDRIVERCONNECT=ODBCVAR=NNJNNORO,DSN=DB_NAME;UID=;PWD=;SP=NLS_LANGUAGE=AMERICAN,NLS_TERRITORY=AMERICA,CODESET=

    If you prefer to use `JDBC`, configure AE as following;
    
        [JDBC]
        SQLDRIVERCONNECT=jdbc:oracle:thin:@AE_DB_SERVER_IP:1521/DB_NAME

    g) Start JWP

        # cd /opt/ae/automationengine/bin
        # java -Xmx512M -jar ucsrvjp.jar

        UC4 AE#WP-Server Version 12.3.0+hf.1.build.1565696063450 (PID=64826)

        # ps -ef | grep -i ucsrvjp

    JWP will use the last WP as worker process.
    
    Check logs;
    
        # cat /opt/ae/automationengine/temp/WPsrv_log_002_00.txt

    h) Add JWP to Service Manager;

    Add the following to `uc4.smd` of Service Manager;
    
        # vi /opt/ae/servicemanager/bin/uc4.smd

        ! JWP
        DEFINE UC4 JWP1;java -jar -Xrs -Xmx512M /opt/ae/automationengine/bin/ucsrvjp.jar -i/opt/ae/automationengine/bin/ucsrv.ini -svc%port%;/opt/ae/automationengine/bin

    Add the following to `uc4.smc` of Service Manager;
    
        # vi /opt/ae/servicemanager/uc4.smc

        WAIT 10
        CREATE UC4 WP2

    i) Restart Service Manager and check if JWP can be start/stop from Service Manager Dialogue.

6. Install JCP;

    a) If you want to use HTTPS for JCP, create a keystore for `*.example.com` and rename the alias to `jetty`;

        # cd $JAVA_HOME/jre/lib/security/
        # openssl pkcs12 -inkey example.com.key -in example.com.crt -export -out jcp.pkcs12
        # keytool -importkeystore -srckeystore jcp.pkcs12 -srcstoretype PKCS12 -destkeystore jcp.jks 
        # keytool -changealias -alias 1 -destalias jetty -keystore jcp.jks
        # cp jcp.jks /opt/ae/automationengine/bin/ssl_certs/
        
    Now add the following to `ucsrv.ini`;
    
        # vi /opt/ae/automationengine/bin/ucsrv.ini

        [REST]
        port=8443
        sslEnabled=1
        keystore=/opt/ae/automationengine/bin/ssl_certs/jcp.jks
        keystorePassword=
        keyPassword=
        parallelDbConnections=5
        
    But if you want to use HTTP for JCP, configure as following;
        
        # vi /opt/ae/automationengine/bin/ucsrv.ini

        [REST]
        port=8088
        sslEnabled=0
        keystore=
        keystorePassword=
        keyPassword=
        parallelDbConnections=5

    b) Add JCP to Service Manager;

    Add the following to `uc4.smd` in Service Manager;
    
        # vi /opt/ae/servicemanager/bin/uc4.smd

        ! JCP
        DEFINE UC4 JCP1;java -jar -Xrs -Xmx512M /opt/ae/automationengine/bin/ucsrvjp.jar -i/opt/ae/automationengine/bin/ucsrv.ini -svc%port% -rest;/opt/ae/automationengine/bin

    Add the following to `uc4.smc` in Service Manager;
    
        # vi /opt/ae/servicemanager/bin/uc4.smc

        WAIT 10
        CREATE UC4 JCP1

    c) Restart Service Manager and check if JCP can be start/stop from Service Manager Dialogue.

    d) Check logs;
    
        # cat /opt/ae/automationengine/temp/CPsrv_log_002_00.txt

    JCP will use the last CP as communication process.

7. Install CAPKI;

    a) Install CAPKI;

    Go to [https://downloads.automic.com/downloads/component_downloads](https://downloads.automic.com/downloads/component_downloads) and search for `capki`. Download it and then run the `setup` script as `root`;

        # cd /opt/ae/capki/
        # ./setup install caller=AE123 veryverbose env=all instdir=/opt/ae/capki/

    If `return code = 0`, it means CAPKI has installed successfully. 

    b) Check the environmental variable;

        # echo $CALIB
        /opt/ae/capki/lib

        # echo $CABIN
        /opt/ae/capki/bin

        # echo $CASHCOMP
        /opt/ae/capki

    If any of the variable returns `NULL`, logout from the current SSH session and log back in.
    
    c) Check certificate;  
    
    When CAPKI is installed, it will create a self-signed certificate. The certificate and key will be stored in the following location;

    Cert: /opt/ae/automationengine/bin/ucsrv_certificate.pem  
    Key: /opt/ae/automationengine/bin/ucsrv_key.pem

    Check `ucsrv.ini` file to see if CAPKI is configured correctly;

        # vi /opt/ae/automationengine/bin/ucsrv.ini

        certificate=/opt/ae/automationengine/bin/ucsrv_certificate.pem
        key=/opt/ae/automationengine/bin/ucsrv_key.pem

    d) Restart Service Manager and then use Service Manager Dialogue to connect to the server. Now the connection between Service Manager Dialogue running in your machine and server's Service Manager will use TLS1.2 for communication.

    e) You also need to install CAPKI in your machine from where you are running the Service Manager Dialogue. To install CAPKI in your machine, run the following;
    
        PS > .\setup.exe install caller=AE123
