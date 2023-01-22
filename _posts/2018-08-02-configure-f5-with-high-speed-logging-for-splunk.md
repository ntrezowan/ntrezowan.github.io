---
title: "Configure F5 with High Speed Logging for Splunk"
comments: false
description: "Configure F5 for Splunk"
keywords: "F5, hsl, hish speed logging, request logging, management port logging, asm logging, apm logging, configure"
published: true
---
### Environment
F51 self IP for VLAN1 = 11.11.11.2  
F52 self IP for VLAN1 = 11.11.11.3  
F5SERV Floating IP for VLAN1 = 11.11.11.1  
F51 self IP for management VLAN = 10.1.1.2  
F52 self IP for management VLAN = 10.1.1.3  
F5SERV Floating IP for management VLAN = 10.1.1.1  
Splunk IP = 10.10.10.1  
Splunk TCP Port = 9515 (for ASM)  
Splunk UDP Port = 9514 (for SYSLOG, HSL and APM) 

---
### Log Flow
> Virtual Server >> Logging Profile >> Log Publisher >> Log Destination >> Pool >> Splunk Log Server

---
### A. Check network connectivity
1. Ping Splunk log server from F5;  
```
# ping 10.10.10.1
PING 10.10.10.1 (10.10.10.1) 56(84) bytes of data.
64 bytes from 10.10.10.1: icmp_seq=1 ttl=63 time=0.838 ms
^C
```
If ping is down, it does not necessarily mean that no log will go to Splunk server because F5 will send logs to a predefined TCP/UDP port. But we need to have ping enabled so that we can use `gateway_icmp` for monitoring when we create a pool.

2. Check how F5 is reaching Splunk log server;  
```
# ip route get 10.10.10.1
10.10.10.1 via 20.20.20.1 prd vlan1  src 11.11.11.2
cache
```
Here `11.11.11.2` is the TMM interface (also self non-floating IP for `F51`) which will be the source when logs are send to `10.10.10.1`.
If there is no route to Splunk, add a static route and verify;  
```
# ip route add 10.10.10.1/32 via vlan1
# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         20.20.20.1      0.0.0.0         UG    0      0        0 vlan1
0.0.0.0         10.1.1.1        0.0.0.0         UG    9      0        0 mgmt
10.1.1.0        0.0.0.0         255.255.254.0   U     0      0        0 mgmt
127.1.1.0       0.0.0.0         255.255.255.0   U     0      0        0 tmm
127.7.0.0       127.1.1.253     255.255.0.0     UG    0      0        0 tmm
127.20.0.0      0.0.0.0         255.255.0.0     U     0      0        0 tmm_bp
10.10.10.1      0.0.0.0         255.255.255.255 U     0      0        0 vlan1
20.20.20.0      0.0.0.0         255.255.255.0   U     0      0        0 vlan1
```
3. Run Netcat to check if you can send logs to a specific remote port of Splunk server.  
To test if you can reach a UDP remote port, run the following and then search in Splunk with `HOST=f51* f51-UDP`. 
```
# route echo '<0>f51-UDP' | nc -w 1 -u 10.10.10.1 9514
```
To test if you can reach a TCP remote port, run the following and then search in Splunk with `HOST=f51* f51-TCP`. 
```
# route echo '<0>f51-TCP' | nc -w 1 -t 10.10.10.1 9515
```
4. You can also do a tcpdump to check if you can send logs to a specific remote port of Splunk server.  
Run the following in one terminal to monitor TCP port;
```
# tcpdump -A -nni vlan1 host 10.10.10.1 and port 9515
```
While tcpdump is running, open another terminal and run the following and check if this log shows in tcpdump output. Also check `/var/log/ltm` and search in Splunk server with `HOST=f51* DUMPLING`.
```
# logger -p local0.notice "DUMPLING”
```
If `nc` or `tcpdump` works, it means F5 can send logs to specific Splunk ports without any issue. If any of them did not worked, check "Check Network Connectivity" section again.

---

### B. Configure F5 and Splunk server
1. In F5, check `syslog-ng` global and local configuration;  
```
# cat /var/run/config/syslog-ng.conf
```
Check default log path of SYSLOG, APM and ASM;  
SYSLOG  -> # local0.*  
APM     -> # local1.*  
ASM     -> # local3.*  

2. Check if there is any pre-configured remote log server in F5; 
```
# tmsh list /sys syslog remote-servers
sys syslog {
    remote-servers none
}
```
If there is any remote log server, we need to remove it because this type of configuration does not allow us to set severity level of outgoing logs. To remove `remote-servers`, run the following;
```
# tmsh
(tmos)# modify /sys syslog remote-servers none
(tmos)# save /sys config
```
3. Now add Splunk server as a `include` which will allow us to filter outgoing logs;
```
(tmos)# edit /sys syslog all-properties
sys syslog {
    auth-priv-from notice
    auth-priv-to emerg
    clustered-host-slot enabled
    clustered-message-slot disabled
    console-log enabled
    cron-from warning
    cron-to emerg
    daemon-from notice
    daemon-to emerg
    description none
    include "
    filter f_ssl_acc_req {
        not (facility(local6) and level(info) and filter(f_httpd_ssl_acc)) and
        not (facility(local6) and level(info) and filter(f_httpd_ssl_req)) and
        level(info..emerg);
    };
    destination d_remote_loghost {
        tcp(\"10.10.10.1\" port(9515));
        udp(\"10.10.10.1\" port(9514));
    };
    log {
        source(s_syslog_pipe);
        filter(f_ssl_acc_req);
        destination(d_remote_loghost);
    };
    "
    iso-date enabled
    kern-from debug
    kern-to emerg
    local6-from notice
    local6-to emerg
    mail-from notice
    mail-to emerg
    messages-from notice
    messages-to warning
    remote-servers none
    user-log-from notice
    user-log-to emerg
}
```
Here under `include` section, `10.10.10.1` is Splunk server IP and F5 will send logs to `9514/udp` and `9515/tcp` port of Splunk. In filter section, we set the severity level from informational to emergency for SYSLOG (/var/logs/ltm).

4. Change date format to `iso-date`;
```
(tmos)# modify sys syslog iso-date enabled
(tmos)# save /sys config
```
5. In Splunk server, modify `inputs.conf` so that F5 source-type matches with `inputs.conf`;  
F5 Source Type ->
```
SYSLOG  (/var/log/ltm) -> f5:bigip:syslog
APM     (/var/log/apm) -> f5:bigip:apm:syslog
ASM     (/var/log/asm) -> f5:bigip:asm:syslog
```
inputs.conf ->
```
[udp://9514]
disabled = true
connection_host=ip
sourcetype = f5:bigip:syslog
[udp://9514]
disabled = true
connection_host=ip
sourcetype = f5:bigip:apm:syslog
[tcp://9515]
disabled = true
connection_host=ip
sourcetype = f5:bigip:asm:syslog
```
In here, SYSLOG and APM is using `9514/udp` and ASM is using `9515/tcp`.

6. Go to Splunk and search with the following to verify that SYSLOG (/var/log/ltm) shows up in Splunk;
- Search `host=f51* mcpd` to see if it’s getting `mcpd` logs
- Search `host=f51* tmm*` to see if it’s getting `tmm` logs

---

### C. Configure HSL to use TMM ports
1. Create a pool and add Splunk as a backend server of the pool.
Go to `Local Traffic > Pools`. Click Create, select Advanced from Configuration and configure as following;
```
Name = splunk_pool
Pool Health Monitor = gateway_icmp
Node Health Monitor = udp
Address = 10.10.10.1
Service Port = 9514
```

2. Create an iRule and add it to a VIP. 
Go to `Local Traffic > iRules > iRules List`. Click Create and here is a sample iRule which does Apache like HTTP Request/Response logging;
```
when CLIENT_ACCEPTED {
    set client_address [IP::client_addr]
    set vip [IP::local_addr]
    set hsl [HSL::open -proto TCP -pool /Common/splunk_pool]
}
when HTTP_REQUEST {
    set http_host [HTTP::host]:[TCP::local_port]
    set http_uri [HTTP::uri]
    set http_url $http_host$http_uri
    set http_method [HTTP::method]
    set http_version [HTTP::version]
    set http_user_agent [HTTP::header "User-Agent"]
    set http_content_type [HTTP::header "Content-Type"]
    set http_referrer [HTTP::header "Referer"]
    set tcp_start_time [clock clicks -milliseconds]
    set req_start_time [clock format [clock seconds] -format "%Y/%m/%d %H:%M:%S"]
    set cookie [HTTP::cookie names]
    set user [HTTP::username]
    set virtual_server [LB::server]
      
    if { [HTTP::header Content-Length] > 0 } then {
        set req_length [HTTP::header "Content-Length"]
    } else {
        set req_length 0
    }
}
when HTTP_RESPONSE {
#    set res_start_time [clock format [clock seconds] -format "%Y/%m/%d %H:%M:%S"]
    set node [IP::server_addr]
    set node_port [TCP::server_port]
    set http_status [HTTP::status]
    set req_elapsed_time [expr {[clock clicks -milliseconds] - $tcp_start_time}]
    if { [HTTP::header Content-Length] > 0 } then {
        set res_length [HTTP::header "Content-Length"]
    } else {
        set res_length 0
    }
    #log local0.info "SYSLOGOD CLIENT_IP=$client_address, VIP=$vip, VIP_NAME=\"$virtual_server\", SERVER_NODE=$node, SERVER_NODE_PORT=$node_port, HTTP_URL=$http_url, HTTP_VERSION=$http_version, HTTP_STATUS=$http_status, HTTP_METHOD=$http_method, HTTP_CONTENT_TYPE=$http_content_type, HTTP_USER_AGENT=\"$http_user_agent\", HTTP_REFERRER=\"$http_referrer\", COOKIE=\"$cookie\", REQUEST_START_TIME=$req_start_time, RESPONSE_START_TIME=$res_start_time, REQUEST_ELAPSED_TIME=$req_elapsed_time, BYTES_IN=$req_length, BYTES_OUT=$res_length\r\n"
    set hsl [HSL::open -proto UDP -pool /Common/splunk_pool]
    HSL::send $hsl "<190> HSL, CLIENT_IP=$client_address, VIP=$vip, VIP_NAME=\"$virtual_server\", SERVER_NODE=$node, SERVER_NODE_PORT=$node_port, HTTP_URL=$http_url, HTTP_VERSION=$http_version, HTTP_STATUS=$http_status, HTTP_METHOD=$http_method, HTTP_CONTENT_TYPE=$http_content_type, HTTP_USER_AGENT=\"$http_user_agent\", HTTP_REFERRER=\"$http_referrer\", COOKIE=\"$cookie\", REQUEST_START_TIME=$req_start_time,REQUEST_ELAPSED_TIME=$req_elapsed_time, BYTES_IN=$req_length, BYTES_OUT=$res_length\r\n"
}
when LB_FAILED {
    set hsl [HSL::open -proto UDP -pool /Common/splunk_pool]
    HSL::send $hsl "<190> HSL, CLIENT_IP=$client_address, VIP=$vip, VIP_NAME=\"$virtual_server\", SERVER_NODE=$node, SERVER_NODE_PORT=$node_port, HTTP_URL=$http_url, HTTP_VERSION=$http_version, HTTP_STATUS=$http_status, HTTP_METHOD=$http_method, HTTP_CONTENT_TYPE=$http_content_type, HTTP_USER_AGENT=\"$http_user_agent\", HTTP_REFERRER=\"$http_referrer\", COOKIE=\"$cookie\", REQUEST_START_TIME=$req_start_time,REQUEST_ELAPSED_TIME=$req_elapsed_time, BYTES_IN=$req_length, BYTES_OUT=$res_length\r\n"
}
```

3. Browse the VIP where you have applied the iRule and then go to Splunk and search for `HOST=f51* HSL`. If nothing shows up in Splunk, uncomment `#log local0.info` from the iRule to start writing logs in local SYSLOG (/var/logs/ltm). If logs are writing in local file but not showing up in Splunk, it means there is some network issue. If logs are not writing in local SYSLOG, try using a simpler iRule.

---

### D. Configure HSL to use Management port
1. Verify that F5 is using management port to reach Splunk;
```
# ip route get 10.10.10.1
10.10.10.1 via 10.1.1.1 prd mgmt  src 10.1.1.2
```
If not, configure F5 so that it uses management port to reach Splunk;
```
(tmos)# create /sys log-config destination management-port splunk ip-address 10.10.10.1 port 9514 protocol udp
(tmos)# list sys management-route
sys management-route splunk {
    gateway 10.1.1.1
    network 10.10.10.1/32
}
(tmos)# save sys config
```

2. Create a Log destination.  
Go to `System > Logs > Configuration > Log Destinations`. Create New and configure as following;
```
Name = splunk_hsl_via_mgmt_port
Type = Management Port
Address = 10.10.10.1
Port = 9515
Protocol = TCP
```

3. Create a Log publisher.  
Go to `System > Logs > Configuration> Log Publisher`. Create New and configure as following;
```
Name = splunk_hsl_publisher
Destination = splunk_hsl_via_mgmt_port
```
4. Create an iRule and add it to a VIP. 
Go to `Local Traffic > iRules > iRules List`. Click Create and here is a sample iRule which does Apache like HTTP Request/Response logging;
```
when CLIENT_ACCEPTED {
    set client_address [IP::client_addr]
    set vip [IP::local_addr]
}
when HTTP_REQUEST {
    set http_host [HTTP::host]:[TCP::local_port]
    set http_uri [HTTP::uri]
    set http_url $http_host$http_uri
    set http_method [HTTP::method]
    set http_version [HTTP::version]
    set http_user_agent [HTTP::header "User-Agent"]
    set http_content_type [HTTP::header "Content-Type"]
    set http_referrer [HTTP::header "Referer"]
    set tcp_start_time [clock clicks -milliseconds]
    set req_start_time [clock format [clock seconds] -format "%Y/%m/%d %H:%M:%S"]
    set cookie [HTTP::cookie names]
    set user [HTTP::username]
    set virtual_server [LB::server]
      
    if { [HTTP::header Content-Length] > 0 } then {
        set req_length [HTTP::header "Content-Length"]
    } else {
        set req_length 0
    }
}
when HTTP_RESPONSE {
#    set res_start_time [clock format [clock seconds] -format "%Y/%m/%d %H:%M:%S"]
    set node [IP::server_addr]
    set node_port [TCP::server_port]
    set http_status [HTTP::status]
    set req_elapsed_time [expr {[clock clicks -milliseconds] - $tcp_start_time}]
    if { [HTTP::header Content-Length] > 0 } then {
        set res_length [HTTP::header "Content-Length"]
    } else {
        set res_length 0
    }
    #log local0.info "SYSLOGDD CLIENT_IP=$client_address, VIP=$vip, VIP_NAME=\"$virtual_server\", SERVER_NODE=$node, SERVER_NODE_PORT=$node_port, HTTP_URL=$http_url, HTTP_VERSION=$http_version, HTTP_STATUS=$http_status, HTTP_METHOD=$http_method, HTTP_CONTENT_TYPE=$http_content_type, HTTP_USER_AGENT=\"$http_user_agent\", HTTP_REFERRER=\"$http_referrer\", COOKIE=\"$cookie\", REQUEST_START_TIME=$req_start_time, RESPONSE_START_TIME=$res_start_time, REQUEST_ELAPSED_TIME=$req_elapsed_time, BYTES_IN=$req_length, BYTES_OUT=$res_length\r\n"
    set hsl [HSL::open -publisher /Common/splunk_hsl_publisher]
    HSL::send $hsl "<190> HSL, CLIENT_IP=$client_address, VIP=$vip, VIP_NAME=\"$virtual_server\", SERVER_NODE=$node, SERVER_NODE_PORT=$node_port, HTTP_URL=$http_url, HTTP_VERSION=$http_version, HTTP_STATUS=$http_status, HTTP_METHOD=$http_method, HTTP_CONTENT_TYPE=$http_content_type, HTTP_USER_AGENT=\"$http_user_agent\", HTTP_REFERRER=\"$http_referrer\", COOKIE=\"$cookie\", REQUEST_START_TIME=$req_start_time,REQUEST_ELAPSED_TIME=$req_elapsed_time, BYTES_IN=$req_length, BYTES_OUT=$res_length\r\n"
}
when LB_FAILED {
    set hsl [HSL::open -publisher /Common/splunk_hsl_publisher]
    HSL::send $hsl "<190> HSL, CLIENT_IP=$client_address, VIP=$vip, VIP_NAME=\"$virtual_server\", SERVER_NODE=$node, SERVER_NODE_PORT=$node_port, HTTP_URL=$http_url, HTTP_VERSION=$http_version, HTTP_STATUS=$http_status, HTTP_METHOD=$http_method, HTTP_CONTENT_TYPE=$http_content_type, HTTP_USER_AGENT=\"$http_user_agent\", HTTP_REFERRER=\"$http_referrer\", COOKIE=\"$cookie\", REQUEST_START_TIME=$req_start_time,REQUEST_ELAPSED_TIME=$req_elapsed_time, BYTES_IN=$req_length, BYTES_OUT=$res_length\r\n"
}
```
5. Browse the VIP where you have applied the iRule and then go to Splunk and search for `HOST=f511* HSL`.

---

### E. Configure HSL for AFM/DOS/BOT/SSL
1. In this section, we are going to create a log publisher for AFM.  
First, create an unformatted HSL log destination. 
Go to `System > Logs > Configuration > Log Destinations`. Click on Create and configure as following;
```
Name = splunk_afm_unformatted
Type = Remote HSL
Pool = splunk_pool
Protocol = UDP
```

2. Create a formatted HSL log destination for Splunk. Go to `System > Logs > Configuration > Log Destinations`. Click on Create and configure as following;
```
Name = splunk_afm_formatted
Type = Remote Syslog
Syslog Format = Splunk
Forward to = splunk_afm_unformatted
```

3. Create a HSL log publisher. Go to `System > Logs > Configuration > Log Publishers`. Click on Create and configure as following;
```
Name = splunk_afm_publisher
Destination = splunk_afm_formatted
```

4. Create a firewall logging profile. Go to `Security > Event Logs > Logging Profiles`. Click on Create and configure as following;
```
Name = splunk_afm_logging
Network Firewall = Tick
---
Publisher = splunk_afm_publisher
Aggregate Rate Limit = Indefinite
Log Rule Messages 
		  -> Accept = Indefinite
		  -> Drop = Indefinite
		  -> Reject = Indefinite
Log IP Errors = Enabled
Log TCP Errors = Enabled
Log TCP Event = Enabled
Log Transation Fields = Enabled
Always Log Region = Enabled
Storage Format = User-Defined
ACTION=${action}, SOURCE_IP=${src_ip}:${src_port}, REMOTE_IP=${dest_ip}:${dest_port}, REMOTE_LOCATION=${dest_geo}, PROTOCOL=${protocol}, TRANS_SOURCE_IP=${translated_src_ip}:${translated_src_port}, TRANS_REMOTE_IP=${translated_dest_ip}:${translated_dest_port}, DROP_REASON=${drop_reason}, VLAN=${vlan}
---
IP Intelligence 
Publisher = splunk_afm_publisher
Log Translation Fields = Enabled
---
Traffic Statistics
Publisher = splunk afm_publisher
Aggregate Rate Limit = Indefinite
Log Timer Events = Active Flows
---
Port Misuse
Publisher = splunk_afm_publisher
Aggregate Rate Limit = Indefinite
```

5. Add the logging profile to a VIP with a APM policy. Go to `Local Traffic > Virtual Servers`. Click on the Virtual Server where you want to apply logging and go to `Security > Policies` tab. Now configure as following;
```
Network Firewall 
		  -> Enforcement = Enabled
		  -> Staging = Disabled
Policy = {a_prefedined policy}
Log Profile = splunk_afm_logging
```

6. Go to Splunk and search for `host=f51* "ACTION=Drop"`.

---

### F. Configure HSL for Request Logging
1. Go to `Local Traffic > Profiles > Other > Request Logging`. Click Create and configure as following;
```
Name = splunk_http_request_logging
Parent Profile = request-log
Request Logging = Enabled
Template = $DATE_NCSA REQUEST -> CLIENT = $CLIENT_IP:$CLIENT_PORT, VIP = $VIRTUAL_IP:$VIRTUAL_PORT, HTTP_VERSION = $HTTP_VERSION, HTTP_METHOD = $HTTP_METHOD, HTTP_KEEPALIVE = $HTTP_KEEPALIVE, HTTP_PATH = $HTTP_PATH, HTTP_QUERY = $HTTP_QUERY, HTTP_REQUEST = $HTTP_REQUEST, HTTP_URI = $HTTP_URI
HSL Protocol = UDP
Pool Name = splunk_pool
Response Logging = Enabled
Template = $DATE_NCSA, RESPONSE -> CLIENT = $CLIENT_IP:$CLIENT_PORT, VIP = $VIRTUAL_IP:$VIRTUAL_PORT, SERVER = $SERVER_IP:$SERVER_PORT, HTTP_VERSION = $HTTP_VERSION, HTTP_METHOD = $HTTP_METHOD, HTTP_KEEPALIVE = $HTTP_KEEPALIVE, HTTP_PATH = $HTTP_PATH, HTTP_QUERY = $HTTP_QUERY, HTTP_REQUEST = $HTTP_REQUEST, HTTP_STATUS = $HTTP_STATUS, HTTP_URI = $HTTP_URI, SNAT_IP = $SNAT_IP:$SNAT_PORT, F5_HOSTNAME = $BIGIP_HOSTNAME, RESPONSE_TIME = $RESPONSE_MSECS, RESPONSE_SIZE = $RESPONSE_SIZE
HSL Protocol = UDP
Pool Name = splunk_pool
```

2. Go to `Local Traffic > Virtual Servers`. Click on the VIP which you want to use Request Logging. Select Advanced of Configuration and then choose `Request Logging Profile` as `splunk_http_request_logging`

3. Browse the VIP where you have applied the iRule and then go to Splunk and search for `HOST=f51* REQUEST`
