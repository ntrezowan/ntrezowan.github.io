---
title: "Creating EDGE dialer for GrameenPhone"
comments: false
description: "Creating EDGE dialer for GrameenPhone"
keywords: "GrameenPhone, edge, fedora, nokia, 7610"
published: true
---
> Operating System: _Fedora 4_  
> Hardware : _Nokia 7610i_

___

1. Run the following command as `root` to load the USB driver;  
```
# /sbin/modprobe usbserial vendor=0x`
Product=0x
```

2. Create a new dialer;  
```
# wvdialconf create
Scanning your serial ports for a modem.
PortScan<*1>: S0 S1 S2 S3
WvModem<*1>: Cannot get information for serial port.
ttyACM0<*1>: ATQ0 V1 E1 -- OK
ttyACM0<*1>: ATQ0 V1 E1 Z -- OK
ttyACM0<*1>: ATQ0 V1 E1 S0=0 -- OK
ttyACM0<*1>: ATQ0 V1 E1 S0=0 &C1 -- OK
ttyACM0<*1>: ATQ0 V1 E1 S0=0 &C1 &D2 -- OK
ttyACM0<*1>: ATQ0 V1 E1 S0=0 &C1 &D2 +FCLASS=0 --
OK  
ttyACM0<*1>: Modem Identifier: ATI -- Nokia
ttyACM0<*1>: Speed 4800: AT -- OK
ttyACM0<*1>: Speed 9600: AT -- OK
ttyACM0<*1>: Speed 19200: AT -- OK
ttyACM0<*1>: Speed 38400: AT -- OK
ttyACM0<*1>: Speed 57600: AT -- OK
ttyACM0<*1>: Speed 115200: AT -- OK
ttyACM0<*1>: Speed 230400: AT -- OK
ttyACM0<*1>: Speed 460800: AT -- OK
ttyACM0<*1>: Max speed is 460800; that should be safe.
ttyACM0<*1>: ATQ0 V1 E1 S0=0 &C1 &D2 +FCLASS=0 --
OK  
Found an USB modem on /dev/ttyACM0.
Modem configuration written to create.
ttyACM0: Speed 460800; init "ATQ0 V1 E1 S0=0
&C1 &D2 +FCLASS=0"
```

3. Add the following configuration in `/etc/wvdial.conf` (remove if there is any existing entries);
```
[Dialer Defaults]
Modem =
Baud = 230400
Init1 = ATZ
Init2 = ATQ0 V1 E1 S0=0 &C1 &D2 +FCLASS=0
ISDN = 0
Modem Type = Analog Modem
Phone = *99***1#
Username = A
Password = B
Stupid Mode = 1
```

4. Dial the modem from your machine;  
```
# wvdial
[Sample output]
--> WvDial: Internet dialer version 1.54.0
--> Warning: section [Dialer bg] does not exist in wvdial.conf.
--> Cannot get information for serial port.
--> Initializing modem.
--> Sending: ATZ
ATZ
OK
--> Sending: ATQ0 V1 E1 S0=0 &C1 &D2 +FCLASS=0
ATQ0 V1 E1 S0=0 &C1 &D2 +FCLASS=0
OK
--> Modem initialized.
--> Sending: ATDT*99#
--> Waiting for carrier.
ATDT*99#
CONNECT
~[7f]}#@!}!} } }2}#}$@#}!}$}%..}"}&} }*} } g}%~
--> Carrier detected. Starting PPP immediately.
--> Starting pppd at Mon May 21 09:44:10 2007
--> pid of pppd: 3748
--> Using interface ppp0
--> pppd: Modem
--> pppd: Modem
--> pppd: Modem
--> local IP address 10.10.10.10
--> pppd: Modem
--> remote IP address 10.10.10.1
--> pppd: Modem
--> primary DNS address 20.20.20.1
--> pppd: Modem
--> secondary DNS address 20.20.20.2
--> pppd: Modem
```

5. If you are having issue browsing internet, add GrameenPhone DNS to `/etc/resolvr.conf`;  
```
# vi /etc/resolv.conf
[Sample configuration]
nameserver X.X.X.X
nameserver X.X.X.X
```

6. Finally, restart DNS daemon;  
```
# service named restart
```
