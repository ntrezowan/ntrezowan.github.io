---
layout: post
title: "GlusterFS and CephFS Performance in Xen Hypervisor"
comments: false
description: "GlusterFS and CephFS Performance in Xen Hypervisor"
keywords: "glusterfs, cephfs, performance, xen, hypervisor, virtual, machine"
---

## A. Host/Virtual Machines Configuration
### 1. Virtual Machines
#### 1.1 GlusterFS VMs

Hostname | gfs1 | gfs2 | gfs3
--- | --- | --- | ---
Operating System | CentOS 6.5 | CentOS 6.5 | CentOS 6.5 
RAM | 2 GB | 2 GB | 2 GB
Disk | 100 GB | 100 GB | 100 GB
Network | Bridged | Bridged | Bridged
IP Address | 192.168.26.234 | 192.168.26.235 | 192.168.26.236

#### 1.2 CephFS VMs

Hostname | ceph1 | ceph2 | ceph3
--- | --- | --- | ---
Operating System | CentOS 6.5 | CentOS 6.5 | CentOS 6.5 
RAM | 2 GB | 2 GB | 2 GB
Disk | 100 GB | 100 GB | 100 GB
Network | Bridged | Bridged | Bridged
IP Address | 192.168.26.237 | 192.168.26.238 | 192.168.26.239

#### 1.3 Client VMs

Hostname | client1 | client2
--- | --- | ---
Operating System | CentOS 6.5 | Ubuntu 12.04
RAM | 2 GB | 2 GB
Disk | 100 GB | 100 GB
Network | Bridged | Bridged
IP Address | 192.168.26.240 | 192.168.26.241

### 2 Host Machines

Hostname | server1 | server2 | server3 | server4
--- | --- | --- | --- | ---
OS | CentOS 6.5 | CentOS 6.5 | CentOS 6.5 | CentOS 6.5
RAM (DDR3) | 4 GB | 4 GB | 4 GB | 4 GB
Disk (7200 RPM) | 300 GB | 300 GB | 300 GB | 300 GB
Network (1GB) | NAT+Bridged | NAT+Bridged | NAT+Bridged | NAT+Bridged
IP Address | 192.168.26.230 | 192.168.26.231 | 192.168.26.232 | 192.168.26.233

___

## B. Install Hypervisor and configure VMs
### 1. Installing the hypervisor

1. Install Xen4 CentOS stack from the repository;
```
# yum install centos-release-xen
```

2. Install Xen itself;
```
# yum install xen
# /etc/init.d/xend start
```

3. With the default installation, Xen hypervisor runs above the host linux kernel, so we need to change the boot order of the linux kernel to dom0(Host operating system). The `centoso-release-xen` installer includes a script called `grub-bootxen.sh` which will change the host operating systems boot order configuration with a predefined value;
```
# /usr/bin/grub-bootxen.sh
```  
Which will change `/boot/grub/grub.conf` to the following configuration;  
```
# cat /boot/grub/grub.conf | more
title CentOS (x.x.xx-x.elx.centos.alt.x86_64) 
root (hd0,0) 
kernel /xen.gz dom0_mem=1024M,max:1024M loglvl=all guest_loglvl=all 
module /vmlinuz-x.x.xx-x.elx.centos.alt.x86_64 ro root=/dev/mapper/vg_xen01-lv_root rd_LVM_LV=vg_xen01/lv_swap rd_NO_LUKS KEYBOARDTYPE=pc KEYTABLE=uk rd_NO_MD LANG=en_GB rd_LVM_LV=vg_xen01/lv_root SYSFONT=latarcyrheb-sun16 crashkernel=auto rd_NO_DM rhgb quiet 
module /initramfs-x.x.xx-x.elx.centos.alt.x86_64.img
```

4. After the reboot, Xen is loaded properly and to verify;
```
# xm info
```

5. Now we need to install `libvirthich` which will create an internal NAT network for the virtual machines behind the default network card. To install `libvirt` and its dependecies, we will use the following command;
```
# yum install libvirt python-virtinst libvirt-daemon-xen
```
Restart `dom0` machine to make it active.

6. Now install `virt-manager` which is a GUI based virtual machine manager interface for Xen;
```
# yum install virt-manager
# /etc/init.d/libvirtd start
```

7. Since we need to access these virtual machines from other virtual machine hosted in other machines, we need to have a bridged network connection for the guest machines and use them as default interface for guest machine. To do so, we will copy the current configuration from `ifcfg-eth0` and will make necessary changes to create a bridged network;
```
# cp /etc/sysconfig/network-scrpit/ifcfg-eth0 /etc/sysconfig/network-scrpit/ifcfg-br0
# vi /etc/syconfig/network-script/ifcfg-br0
DEVICE=br0
TYPE=Bridge
vi /etc/sysconfig/network-scrpt/ifcfg-eth0
BRIDGE=br0
```
And
```
# vi /etc/sysconfig/network-scrpit/ifcfg-eth0 /etc/sysconfig/network-scrpit/ifcfg-eth0
BRIDGE=br0
```

8. Now we need to restart the network service;
```
# /etc/init.d/network restart
```

9. Xen is ready and we can start installing virtual machines there.

### 2. Installing virtual machine for GlusterFS/Ceph/Client

Based on the above Host machine configuration, we need to create 8 virtual machine out of which 3 machines will be used for GlusterFS and 3 machines will be used for Ceph File System. Remaining 2 machines will be used as client machines. Out of these 8 machines, 7 of them will have CentOS 6.5 and one of the client machine will have Ubuntu 14.04.
Below is a sample configuration used to create 7 CentOS virtual machines;
```
# virt-install \ 
--name=server1 \ 
--file=/var/lib/libvirt/images/gfs1.img \ 
--file-size=100 \ 
--nonsparse 
--vcpus=1  
--ram=2048 \ 
--cdrom /dev/sr0
--network bridge:br0 \ 
--os-type=linux \ 
--os-variant=rhel6
```
Below is the configuration used to create 1 Ubuntu virtual machine;
```
# virt-install \ 
--name=client2 \ 
--file=/var/lib/libvirt/images/client2.img \ 
--file-size=100 \ 
--nonsparse 
--vcpus=1  
--ram=2048 \ 
--cdrom /dev/sr0
--network=bridge:br0 \ 
--os-type=linux \ 
--os-variant=ubuntuquantal
```
### 3. Post installation requirments

1. Configure network for all of these three servers  
2. Configure `/etc/host`s file so that they can resolve each other hostname to IP  
3. Disable `Selinux`  
4. Install `openssh-clients` and `Vi` for work purpose  

___

## C. Installing and configuring GlusterFS

> *gfs1 – Admin node + Gluster node 1*  
> *gfs2 – Gluster node 2 (Monitor daemon, Object storage)*  
> *gfs3 – Gluster node 3 (Monitor daemon, Object storage)*  
> *client1 – CentOS*  
> *client2 – Ubuntu* 

### 1. Install GlusterFS on the storage servers

1. Installing required packages since we have installed the minimal version of CentOS;
```
# yum install wget
```

2. At first, we will add GlusterFS repo in our repositories;
```
# wget -P /etc/yum.repos.d http://download.gluster.org/pub/gluster/glusterfs/LATEST/CentOS/glusterfs-epel.repo
```

3. Now installing Gluster in those three servers one by one;
```
# yum install glusterfs glusterfs-server glusterfs-fuse 
```

4. GlusterFS is installed, now start it for the first time;
```
# /etc/init.d/glusterd start
```

5. Check the installed version of the GlusterFS;
```
# glusterfsd --version
glusterfs x.x.x built on Apr 23 2014 12:53:55
Repository revision: git://git.gluster.com/glusterfs.git
Copyright (c) 2006-2013 Red Hat, Inc. http://www.redhat.com/
```

6. Finally, we want GlusterFS to start automatically at startup. To do that, we will use the following command;
```
#  chkconfig glusterfsd on
```

### 2. Installing GlusterFS on the client machines

1. The client only require glusterfs and glusterfs-fuse to communicate with the servers;
```
# yum -y install glusterfs glusterfs-fuse
```

2. Now check the installed version of the GlusterFS;
```
# glusterfsd --version
glusterfs x.x.x built on Jun 24 2014 15:09:41
Repository revision: git://git.gluster.com/glusterfs.git
Copyright (c) 2006-2013 Red Hat, Inc. http://www.redhat.com/
```

### 3. Creating a trusted pool among the storage servers

1. To create a trusted pool, we have to make sure that all these servers can resolve each other hostname, we will manually enter this information in the `/etc/hosts` file to map IP to hostname;
```
# vi nano /etc/hosts
192.168.26.230    server1
192.168.26.231    server2
192.168.26.232    server3
192.168.26.233    client
192.168.26.234    gfs1
192.168.26.235    gfs2
192.168.26.236    gfs3
192.168.26.237    ceph1
192.168.26.238    ceph2
192.168.26.239    ceph3
```

2. We need to restart the network service to make this change effective;
```
# /etc/init.d/network restart
```

3. Now we will probe from `gfs1` to `gfs2` and from `gfs1` to `gfs3`. We are not going to probe l`ocahost/gfs1`, since we are running these commands from this machines;
```
# gluster peer probe gfs2
Probe successful
# gluster peer probe gfs3
Probe successful
```

4. Finally, verify the newly created trusted pool and check if all the servers are participating or not;
```
# gluster peer status
Number of Peers: 2
Hostname: gfs2
Uuid: 1d6711ad-880c-48de-a81d-9bfa06adf775
State: Peer in Cluster (Connected)
Hostname: gfs3
Uuid: cbda474e-efd7-4bc8-9c6c-4456bf4ec1b6
State: Peer in Cluster (Connected)
```

### 4. Creating a distributed volume in the trusted pool

1. At first, check if TCP connection between three servers are functional or not;
```
# netstat -tap | grep glusterfsd
tcp        0      0 *:49152                     *:*                         LISTEN      3858/glusterfsd     
tcp        0      0 gfs1:exp1                   gfs1:24007                  ESTABLISHED 3858/glusterfsd     
tcp        0      0 gfs1:49152                  gfs2:1016                   ESTABLISHED 3858/glusterfsd     
tcp        0      0 gfs1:49152                  gfs1:1020                   ESTABLISHED 3858/glusterfsd     
tcp        0      0 gfs1:49152                  gfs3:1016                   ESTABLISHED 3858/glusterfsd 
# netstat -tap | grep glusterfsd
tcp        0      0 *:49152                     *:*                         LISTEN      3716/glusterfsd     
tcp        0      0 gfs2:exp1                   gfs2:24007                  ESTABLISHED 3716/glusterfsd     
tcp        0      0 gfs2:49152                  gfs2:1020                   ESTABLISHED 3716/glusterfsd     
tcp        0      0 gfs2:49152                  gfs3:1015                   ESTABLISHED 3716/glusterfsd     
tcp        0      0 gfs2:49152                  gfs1:1014                   ESTABLISHED 3716/glusterfsd 
# netstat -tap | grep glusterfsd
tcp        0      0 *:49152                     *:*                         LISTEN      3733/glusterfsd     
tcp        0      0 gfs3:exp1                   gfs3:24007                  ESTABLISHED 3733/glusterfsd     
tcp        0      0 gfs3:49152                  gfs1:1013                   ESTABLISHED 3733/glusterfsd     
tcp        0      0 gfs3:49152                  gfs3:1020                   ESTABLISHED 3733/glusterfsd     
tcp        0      0 gfs3:49152                  gfs2:1015                   ESTABLISHED 3733/glusterfsd     
```

2. Now create the first volume, `dist-volume` for all these three servers;
```
# gluster volume create dist-volume gfs1:/dist1 gfs2:/dist2 gfs3:/dist3
volume create: dist-volume: success: please start the volume to access data
```

3. Volume has created without any error, now start the volume;
```
# gluster volume start dist-volume
volume start: dist-volume: success
```

4. Finally, verify volume information;
```
# gluster volume info
Volume Name: dist-volume
Type: Distribute
Volume ID: 6bc03033-1df5-45a6-ba9e-aa34786df129
Status: Started
Number of Bricks: 3
Transport-type: tcp
Bricks:
Brick1: gfs1:/dist1
Brick2: gfs2:/dist2
Brick3: gfs3:/dist3
```

5. Now, we need to verify if this distributed volume, `dist-volume` is actually working as it supposed to or not. From `client1`, we will mount this volume and then randomly create some files, download some files from the internet and check if these files are distributed among those three servers. At first, we need to create a directory in the client machine to mount the disk and then mount it;
```
# mkdir /mnt/distributed
# mount.glusterfs gfs1:/dist-volume /mnt/distributed/
```

6. Verify if it is mounted properly;
```
# mount
/dev/xvda2 on / type ext4 (rw)
proc on /proc type proc (rw)
sysfs on /sys type sysfs (rw)
devpts on /dev/pts type devpts (rw,gid=5,mode=620)
tmpfs on /dev/shm type tmpfs (rw)
/dev/xvda1 on /boot type ext4 (rw)
none on /proc/sys/fs/binfmt_misc type binfmt_misc (rw)
gfs1:/dist-volume on /mnt/distributed type fuse.glusterfs (rw,default_permissions,allow_other,max_read=131072)
```

7. Check the available disk space for `client1`;
```
# df -h
Filesystem         Size  Used Avail Use% Mounted on
/dev/xvda2          95G  918M   89G   2% /
tmpfs              938M     0  938M   0% /dev/shm
/dev/xvda1         485M   52M  409M  12% /boot
gfs1:/dist-volume  279G  2.8G  262G   2% /mnt/distributed
```

8. Now create some files from `client1` machine and check if distribution is working amount the servers;
```
# touch test1
# touch test2
# touch test3
# touch test4
# touch test5
# touch test6
# touch test7
# touch test8
# touch test9
# touch test10
# wget https://www.kernel.org/pub/linux/kernel/v3.x/linux-3.15.1.tar.xz
```

9. Check if the files are successfully created;
```
# ls -l
total 77813
-rw-r--r-- 1 root root 79679864 Jun 16 16:54 linux-3.15.1.tar.xz
-rw-r--r-- 1 root root        0 Jun 25 07:23 test1
-rw-r--r-- 1 root root        0 Jun 25 07:24 test10
-rw-r--r-- 1 root root        0 Jun 25 07:23 test2
-rw-r--r-- 1 root root        0 Jun 25 07:23 test3
-rw-r--r-- 1 root root        0 Jun 25 07:23 test4
-rw-r--r-- 1 root root        0 Jun 25 07:23 test5
-rw-r--r-- 1 root root        0 Jun 25 07:24 test6
-rw-r--r-- 1 root root        0 Jun 25 07:24 test7
-rw-r--r-- 1 root root        0 Jun 25 07:24 test8
-rw-r--r-- 1 root root        0 Jun 25 07:24 test9
```

10. Finally, check from all these three servers to see if these 11 files are distributed or not;
```
# ls -l /dist1/
total 0
-rw-r--r-- 2 root root 0 Jun 25 07:24 test10
-rw-r--r-- 2 root root 0 Jun 25 07:23 test3
-rw-r--r-- 2 root root 0 Jun 25 07:24 test6
-rw-r--r-- 2 root root 0 Jun 25 07:24 test7
# ls -l /dist2/
total 77820
-rw-r--r-- 2 root root 79679864 Jun 16 16:54 linux-3.15.1.tar.xz
-rw-r--r-- 2 root root        0 Jun 25 07:23 test1
-rw-r--r-- 2 root root        0 Jun 25 07:23 test2
-rw-r--r-- 2 root root        0 Jun 25 07:23 test4
-rw-r--r-- 2 root root        0 Jun 25 07:23 test5
-rw-r--r-- 2 root root        0 Jun 25 07:24 test9
# ls -l /dist3/
total 0
-rw-r--r-- 2 root root 0 Jun 25 07:24 test8
```


11. We can see that all the files are distributed among all three storage servers.

### 5. Creating a replicated volume in the trusted pool

1. Create the first replicated volume, `rep-volume` for all these three servers;
```
# gluster volume create rep-volume replica 3 gfs1:/rep1 gfs2:/rep2 gfs3:/rep3 force
volume create: rep-volume: success: please start the volume to access data
```

2. Volume has created without any error, now start the volume;
```
# gluster volume start rep-volume
volume start: rep-volume: success
```

3. Finally, verify volume information;
```
# gluster volume start rep-volume
volume start: rep-volume: success
# gluster volume info rep-volume
Volume Name: rep-volume
Type: Replicate
Volume ID: f7765efe-163f-42ab-9fd9-41df18db0f9c
Status: Started
Number of Bricks: 1 x 3 = 3
Transport-type: tcp
Bricks:
Brick1: gfs1:/rep1
Brick2: gfs2:/rep2
Brick3: gfs3:/rep3
```

4. Now, we need to verify if this replicated volume, `rep-volume` is actually working as it supposed to or not. From client1, we will mount this volume and then randomly create some files and check if its completed replicated among those three servers or not. At first, we need to create a directory in the client machine to mount the disk and then mount it;
```
# mkdir /mnt/replicated
# mount.glusterfs gfs1:/rep-volume /mnt/replicated/
```

5. Verify if it is mounted properly; 
```
# mount
/dev/xvda2 on / type ext4 (rw)
proc on /proc type proc (rw)
sysfs on /sys type sysfs (rw)
devpts on /dev/pts type devpts (rw,gid=5,mode=620)
tmpfs on /dev/shm type tmpfs (rw)
/dev/xvda1 on /boot type ext4 (rw)
none on /proc/sys/fs/binfmt_misc type binfmt_misc (rw)
gfs1:/dist-volume on /mnt/distributed type fuse.glusterfs (rw,default_permissions,allow_other,max_read=131072)
gfs1:/rep-volume on /mnt/replicated type fuse.glusterfs (rw,default_permissions,allow_other,max_read=131072)
```

6. Check the available disk space for client1; 
```
# df -h
Filesystem         Size  Used Avail Use% Mounted on
/dev/xvda2          95G  918M   89G   2% /
tmpfs              938M     0  938M   0% /dev/shm
/dev/xvda1         485M   52M  409M  12% /boot
gfs1:/dist-volume  279G  2.8G  262G   2% /mnt/distributed
gfs1:/rep-volume    91G  926M   85G   2% /mnt/replicated
```

7. Now create some files from client1 machine and check if distribution is working amount the servers; 
```
# touch rep1
# touch rep2
# touch rep3
# touch rep4
```

8. Check if the files are successfully created;
```
# ls -l
total 77813
-rw-r--r-- 1 root root 79679864 Jun 16 16:54 linux-3.15.1.tar.xz
-rw-r--r-- 1 root root        0 Jun 25 07:23 test1
-rw-r--r-- 1 root root        0 Jun 25 07:24 test10
-rw-r--r-- 1 root root        0 Jun 25 07:23 test2
-rw-r--r-- 1 root root        0 Jun 25 07:23 test3
-rw-r--r-- 1 root root        0 Jun 25 07:23 test4
-rw-r--r-- 1 root root        0 Jun 25 07:23 test5
-rw-r--r-- 1 root root        0 Jun 25 07:24 test6
-rw-r--r-- 1 root root        0 Jun 25 07:24 test7
-rw-r--r-- 1 root root        0 Jun 25 07:24 test8
-rw-r--r-- 1 root root        0 Jun 25 07:24 test9
```

9. Now check from all these three servers to see if these 4 files are replicated or not;
```
# ls -l /rep1/
total 0
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep1
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep2
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep3
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep4
# ls -l /rep2/
total 0
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep1
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep2
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep3
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep4
# ls -l /rep3/
total 0
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep1
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep2
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep3
-rw-r--r-- 2 root root 0 Jun 25 07:43 rep4
```

10. We can see that all the files are distributed among all three servers.

### 6. Creating a stripped volume in the trusted pool

1. Now create the first replicated volume, `strip-volume` for all these three servers;
```
# gluster volume create strip-volume strip 3 gfs1:/strip1 gfs2:/strip2 gfs3:/strip3 force
volume create: strip-volume: success: please start the volume to access data
```

2. Volume has created without any error, now start the volume;
```
# gluster volume start strip-volume
volume start: strip-volume: success
```

3. Finally, verify volume information; 
```
# gluster volume start strip-volume
volume start: rep-volume: success
# gluster volume info strip-volume
Volume Name: strip-volume
Type: Stripe
Volume ID: 2eb5e39e-c891-4cc9-be5d-1315b284e0e1
Status: Started
Number of Bricks: 1 x 3 = 3
Transport-type: tcp
Bricks:
Brick1: gfs1:/strip1
Brick2: gfs2:/strip2
Brick3: gfs3:/strip3
```

4. Now, we need to verify if this stripped volume, `strip-volume` is actually working as it supposed to or not. From client1, we will mount this volume and then create a large file and check if its stripped among those three servers or not. At first, we need to create a directory in the client machine to mount the disk and then mount it; 
```
# mkdir /mnt/stripped
# mount.glusterfs gfs1:/strip-volume /mnt/stripped/
```

5. Verify if it is mounted properly; 
```
# mount
/dev/xvda2 on / type ext4 (rw)
proc on /proc type proc (rw)
sysfs on /sys type sysfs (rw)
devpts on /dev/pts type devpts (rw,gid=5,mode=620)
tmpfs on /dev/shm type tmpfs (rw)
/dev/xvda1 on /boot type ext4 (rw)
none on /proc/sys/fs/binfmt_misc type binfmt_misc (rw)
gfs1:/dist-volume on /mnt/distributed type fuse.glusterfs (rw,default_permissions,allow_other,max_read=131072)
gfs1:/rep-volume on /mnt/replicated type fuse.glusterfs (rw,default_permissions,allow_other,max_read=131072)
gfs1:/strip-volume on /mnt/stripped type fuse.glusterfs (rw,default_permissions,allow_other,max_read=131072
```

6. Check the available disk space for client1; 
```
# df -h
Filesystem          Size  Used Avail Use% Mounted on
/dev/xvda2           95G  918M   89G   2% /
tmpfs               938M     0  938M   0% /dev/shm
/dev/xvda1          485M   52M  409M  12% /boot
gfs1:/dist-volume   279G  2.8G  262G   2% /mnt/distributed
gfs1:/rep-volume     91G  926M   85G   2% /mnt/replicated
gfs1:/strip-volume  279G  2.8G  262G   2% /mnt/stripped
```

7. We are going to create a 100 GB file and check if its stripped amount these three servers or not;  
```
# dd if=/dev/zero of=/mnt/stripped/stripped-image.img bs=102400k count=1000
1000+0 records in
1000+0 records out
104857600000 bytes (105 GB) copied, 1014.37 s, 103 MB/s
```

8. Now check from all these three servers to see if these 4 files are replicated or not; 
```
# ls -lh /strip1/
total 33G
-rw-r--r-- 2 root root 33G Jun 25 12:48 stripped-image.img
# ls -lh /strip2/
total 33G
-rw-r--r-- 2 root root 33G Jun 25 12:49 stripped-image.img
# ls -lh /strip3/
total 33G
-rw-r--r-- 2 root root 33G Jun 25 12:51 stripped-image.img
```

9. We can see that all the files are stripped among all three servers.

___

## D. Installing and configuring CephFS

> *ceph1 – Admin node*  
> *ceph2 – Ceph node 1 (Monitor daemon, Object storage)*  
> *ceph3 – Ceph node 2 (Monitor daemon, Object storage)*  
> *client1 – CentOS*  
> *client2 – Ubuntu*  

### 1. Install CephFS on the storage servers

1. Create a new Ceph user and set password;
```
# useradd –d /home/ceph –m ceph
# passwd ceph
```

2. Give this new user root previliges;
```
# echo “ceph ALL = (root) NOPASSWD:ALL” | sudo tee /etc/sudoers.d/ceph
# chmod 440 /etc/sudoers.d/ceph
```

3. Add Ceph repositiory to CentOS machine;
```
# sudo nano /etc/yum.repos.d/ceph.repo
```
And add the following lines
```
[ceph-noarch]
name=Ceph noarch packages
baseurl=http://ceph.com/rpm-firefly/el/noarch
enabled=1
gpgcheck=1
type=rpm-md
gpgkey=https://ceph.com/git/?p=ceph.git;a=blob_plain;f=keys/release.asc
```
Update the repository. 
```
# sudo yum update
```

4. Install Ceph;
```
# sudo yum install ceph-deploy
```

4. Create unattented SSH access between ceph1, ceph2 and ceph3;
```
# ssh-keygen
```
Edit SSH config file to allow all cluster to talk with each other;
```
# nano ~./ssh/config
```
Add the following line in the file;
```
Host ceph1
Hostname ceph1
User ceph
Host ceph2
Hostname ceph2
User ceph
Host ceph02
Hostname ceph3
User ceph
```
Give permission to this file;
```
# chmod 600 ~/.ssh/config
```
Now copy this SSH public key to all the nodes;
```
# ssh-copy-id ceph1
# ssh-copy-id ceph2
# ssh-copy-id ceph3
```

5. Create directory for Ceph Cluster in the Admin node;
```
# mkdir ceph-cluster
# cd ceph-cluster
```

6. Configure Ceph Cluster;
```
# ceph-deploy new ceph1 ceph2 ceph3
```

7. Deploy Ceph on all nodes;
```
# ceph-deploy install ceph1 ceph2 ceph3
```

8. Disable `cephx` authentication which is used between to nodes to authenticate each other. In this way we can consume less operational overhead;
```
# nano /home/ceph/ceph-cluster/ceph.conf
Change this file to the following;
auth_server_required=none
auth_cluster_required=none
mon_clock_drift_allowed=10
```
Now restart Ceph;
```
# sudo /etc/init.d/ceph restart
```

9. Install configuration for monitoring and keys;
```
# ceph-deploy –overwrite-conf mon create-initial
```

10. Create directories in all the storage node where Ceph will be mounted;
```
# mkdir /home/ceph/ceph-storage1
# mkdir /home/ceph/ceph-storage2
# mkdir /home/ceph/ceph-storage3
```

11. Prepare Object Storage Daemon;
```
# ceph-deploy osd prepare ceph1:/ceph-storage1 ceph2:/ceph-storage2 ceph3:/ceph-storage3
```

12. Activate Object Storage Daemon;
```
# ceph-deploy osd activate ceph1:/ceph-storage1 ceph2:/ceph-storage2 ceph3:/ceph-storage3
```

13. Configure Meta Data Server;
```
# ceph-deploy admin ceph1
# ceph-deploy mds create ceph1
```

14. Check MDS Status;
```
# ceph mds stat
E32: 1/1/1 up {0=ceph=up:active}
# ceph health
```

15. Configure NTP to sync between nodes;
```
# yum install ntp
# ntpdate
```

16. *Special note:* All CentOS machine have to add ceph in require tty like this;
```
# sudo visudo
```
And change the following line;
```
Defaults:ceph !requiretty
```

### 2. Ceph Client Installation

1. From Admin node (ceph1), install ceph client;
```
# ceph-deploy install client1 client2
```

2. From Admin node (ceph1), copy Ceph configuration file and keyring to client1 and client2;
```
# ceph-deploy admin client1 client2
```

3. From client node (client1), create a Block Device Image of 100 GB to Ceph file system;
```
# rbd create storage1 –size 102400
```

4. Map the image to a block device	
```
# sudo rbd map storage1
```

5. Check RBD mapping;
```
# rbd showmapped
id 	pool	image	snap	device
1	rbd	storage1    -	/dev/rbd1
```

6. Use this block device and create an `ext4` file system;
```
# sudo mkfs.ext4 /dev/rbd/rbd/storage1
```

7. Mount the file system in client machine;
```
# sudo mkdir /mnt/storage1
# sudo mount /dev/rbd/rbd/storage1 /mnt/storage1
```

8. Check the file system; 
```
# df –h
```

9. Do step 3-8 for client2 and here Block Device Image will be `storage2` and mount point will be `/mnt/storage2`.

___

## E. Installing Benchmark Tools

### 1. Installing iozone

1. Since we are using 64-bit operating system, it will be good if we use 64-bit version of iozone. But iozone only provides 32-bit version of RPM package, so we will use Source RPM, compile it to a 64-bit RPM package and then install it. Initially, we will install `rpm-build`, `make` and `gcc` to resolve the dependencies for `rpmbuild`; 
```
# yum install rpm-build
# yum install make
# yum install gcc
```

2. Now we will download iozone source RPM from the authors site and rebuild it according to our OS architecture;
```
# cd /tmp/
# wget http://iozone.org/src/current/iozone-3-424.src.rpm
# rpmbuild --rebuild iozone-3-424.src.rpm
```

3. The newly build RPM package will be stored in the following location, from there we can install the package;
```
# cd ~/rpmbuild/RPMS/x86_64/
# rpm -ivh iozone-3-424.x86_64.rpm 
```

4. Finally, iozone is installed in the following location and we can run iozone from here; 
```
# cd /opt/iozone/bin/
# ./iozone –a
```

5. For client2 (Ubuntu OS), iozone is available in the default repository;
```
# apt-get install iozone3
```

### 2. Installing Bonnie++

1. Bonnie++ does not come with the default CentOS repo list. So we have to frist add `RPMForge` repository and then we can install it;
```
# rpm --import http://apt.sw.be/RPM-GPG-KEY.dag.txt
# rpm -K rpmforge-release-0.5.3-1.el6.rf.*.rpm
# rpm -i rpmforge-release-0.5.3-1.el6.rf.*.rpm
```

2. Now we can install Bonnie++ using yum;
```
# yum install bonnie++
```

3. For client2, Bonnie++ is available in the default repository;
```
# apt-get install bonnie++
```

___

## F. Results

### 1. IOzone

Create a 100 GB File using iozone;
```
# iozone /mnt/distributed/10GB-dist.img –t 4 –r 512k -s 10g –i 0 –i 1 –i 2 | tee –a /root/client1/Distributed/iozone-10g-512k.txt
```

`/mnt/distributed/10GB-dist.img` – we are using the Gluster distributed file system mounted in the client machines to create dummy files (such as, iozone.DUMMY.1, iozone.DUMMY.2, iozone.DUMMY.3 iozone.DUMMY.4) to measure the throughput.

[Parameters]

`r` – Record size or Block size, since most of the spinning disk has a block size of 512k, we have also tested with 1024k and 2048k  
`t` – indicates iozone to run in throughput mode, we have also used 4 threads/processes during the measurement  
`s` – size of the file to test, here 10-dist.img has a file size of 10 GB, so we are using this file to test the throughput  
`i – 0` - write and rewrite  
`i - 1` - read and reread  
`1 - 2` - random read and random write  

We are exporting the result in the txt file to create graph afterword’s.  

*Total number of testing in IOzone:*  
• iozone-100m-512k.txt  
• iozone-100m-1024.txt  
• iozone-100m-2048.txt  
• iozone-1g-512k.txt  
• iozone-1g-1024.txt  
• iozone-1g-2048.txt  
• iozone-4g-512k.txt  
• iozone-4g-1024.txt  
• iozone-4g-2048.txt  
• iozone-8g-512k.txt  
• iozone-8g-1024.txt  
• iozone-8g-2048.txt  
• iozone-10g-512k.txt  
• iozone-10g-1024.txt  
• iozone-10g-2048.txt  

We cannot completely rely on testing `1GB-dist.img` because iozone start buffereing while file size is less than the memory, so we will only focus on 4GB, 8GB and 10GB measurement and 1GB will be only used for reference.

#### 1.1 iozone performance in GlusterFS

In this experiment, we are using the Gluster file system distributed volume which is mounted in the client machine and this directory has used to create dummy files (for example iozone.DUMMY.1, iozone.DUMMY.2 etc) for I/O benchmarking. We have used different file block size (512K, 1024K, 2048K) and different file size (1GB, 4GB, 8GB, 10GB) to get more diverse results. All the testing is run in throughput mode with 4 threads/process and we have taken the average throughput per process. In Figure-1 and Figure-2 we have seen that, file operations such as Write, Read, Re-write, Re-read, Random Write are better in Client1 than Client2 where Random read operation is still bad on both machines. Also note to mention that Client2 works better on Write and Re-write operation than other file operations. In Random read operation, the bigger the file block size, the performance gets better. 

*GlusterFS CentOS Client*

![GlusterFS CentOS Client](http://ntrezowan.github.com/images/gfs1-iozone.jpg)

*GlusterFS Ubuntu Client*

![GlusterFS Ubuntu Client](http://ntrezowan.github.com/images/gfs2-iozone.jpg)

#### 1.2 iozone performance in CephFS
 
*CephFS CentOS Client*

![Ceph CentOS Client](http://ntrezowan.github.com/images/cfs1-iozone.jpg)

*CephFS Ubuntu Client*

![Ceph Ubuntu Client](http://ntrezowan.github.com/images/cfs2-iozone.jpg)

### 2. dd

#### 2.1 GlusterFS Testbed

##### 2.1.1 client1

1. Creating 1GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 1000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/1GB-dist.img bs=1024k count=1000 oflag=direct
```

2. Creating 4GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 4000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/4GB-dist.img bs=1024k count=4000 oflag=direct
```

3. Creating 8GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 8000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/8GB-dist.img bs=1024k count=8000 oflag=direct
```

4. Creating 10GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 10000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/10GB-dist.img bs=1024k count=10000 oflag=direct
```

##### 2.1.2 client2

1. Creating 1GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 1000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/1GB-dist.img bs=1024k count=1000 oflag=direct
```

2. Creating 4GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 4000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/4GB-dist.img bs=1024k count=4000 oflag=direct
```

3. Creating 8GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 8000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/8GB-dist.img bs=1024k count=8000 oflag=direct
```

4. Creating 10GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 10000 times;
```
#  dd if=/dev/zero of=/mnt/distributed/10GB-dist.img bs=1024k count=10000 oflag=direct
```

#### 2.2 CephFS Testbed

##### 2.2.1 client1

1. Creating 1GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 1000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/1GB-dist.img bs=1024k count=1000 oflag=direct
```

2. Creating 4GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 4000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/4GB-dist.img bs=1024k count=4000 oflag=direct
```

3. Creating 8GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 8000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/8GB-dist.img bs=1024k count=8000 oflag=direct
```

4. Creating 10GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 10000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/10GB-dist.img bs=1024k count=10000 oflag=direct
```

##### 2.2.2 client2

1. Creating 1GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 1000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/1GB-dist.img bs=1024k count=1000 oflag=direct
```

2. Creating 4GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 4000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/4GB-dist.img bs=1024k count=4000 oflag=direct
```

3. Creating 8GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 8000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/8GB-dist.img bs=1024k count=8000 oflag=direct
```

4. Creating 10GB of endless stream of zero bytes to /mnt/distributed with block size=1024k and repeat this 10000 times;
```
#  sudo dd if=/dev/zero of=/mnt/distributed/10GB-dist.img bs=1024k count=10000 oflag=direct
```

#### 2.3 dd Performance for GlusterFS and CephFS

*dd performance*

![dd performance](http://ntrezowan.github.com/images/dd.jpg)

___

## G. Summary
Ceph and Gluster file system emerge good technologies to the storage system even if their internal structure are different. Gluster file system performance appear practically solid than Ceph file system which is still in development stage. Both file system supports data de-duplication with fail-over and load balancing which is expected in clustered storage. Ceph file system can be installed and managed very efficiently because a single node interface is capable of managing the entire cluster where in Gluster file system, every node have to managed separately for different purposes. Both file system can be deployed in virtual environments and in cloud computing platform from where clients can manage their user space. These two file system are open-source which gives alternative solution to expensive storage system and also supports most of the inexpenvive and commodity hardware.

