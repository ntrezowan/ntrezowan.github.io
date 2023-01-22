---
title: "F5 Clean Installation Using ISO"
comments: false
description: "F5 Clean Installation Using ISO"
keywords: "f5, iso, tmos, installation, usb, disk, drive, bootable"
published: true

---



### Install using USB media

A. Create a bootable USB drive using your computer
1. Download the image from [https://downloads.f5.com/](https://downloads.f5.com/) into you computer

2. Mount the image;

        # mkdir /mnt/cd
        # mount -o loop /shared/images/BIGIP-13.1.1.5-0.0.4.iso /mnt/cd
        mount: /shared/images/BIGIP-13.1.1.5-0.0.4.iso is write-protected, mounting read-only

3. Insert a USB disk and run `mkdisk` script;

        # cd /mnt/cd
        # ./mkdisk

    In the next step, F5 will ask you the following questions. Answer as appropriate to your environment;

        7047 blocks
        On which F5 platform will the installation media be used?
        Index Platform
        1 BIG-IP 1500
        2 BIG-IP 1600
        3 BIG-IP 3400
        4 BIG-IP 3410
        5 BIG-IP 3600
        6 BIG-IP 3900
        7 BIG-IP 4100
        8 BIG-IP 6400
        9 BIG-IP 6800
        10 BIG-IP 6900
        11 BIG-IP 8400
        12 BIG-IP 8800
        13 BIG-IP 8900
        14 BIG-IP 8950
        15 BIG-IP 11050
        16 BIG-IP Viprion
        17 BIG-IP_SAM 4300
        18 Enterprise Manager EM500
        19 Enterprise Manager EM3000
        20 FirePass 1200
        21 FirePass 4100
        22 FirePass 4300

        Please select a device by index (1 – 26) —>7

        Index Device Product Size Notes

        1 /dev/sdb SanDisk Cruzer Blade 3817 MB May hold 2 products
        Please select a device by index (1 – 1) —>1

        Chosen device /dev/sdb is SanDisk Cruzer Blade

        WARNING: The next step will destroy all data on this device!
        Are you sure you want to continue? (y|n) [n] –> y

        info: FAT Formatting device /dev/sdb
        info: Installing bootloader on /dev/sdb
        info: Mounting device /dev/sdb on /mnt/ozimLXTaYx
        copying ./isolinux/vmlinuz => /mnt/ozimLXTaYx
        copying ./isolinux/initrd.img => /mnt/ozimLXTaYx
        The following products are available for transfer:
        BIG-IP version 13.1.1.5

        Would you like to transfer BIG-IP version 13.1.1.5? (y|n) [y] –> y
        Queueing BIG-IP version 13.1.1.5
        Ready to copy one product (this will take a while…).
        Creating repository ISO in /mnt/tm_install/16082.mJRdtt (this will take a while)…
        Using TS_MN000.RPM;1 for ././BIGIP13115/i686/TS-mng-fbagent-13.1.1.5-1707.0.i686.rpm (TS-mng-fbloader-13.1.1.5-1707.0.i686.rpm)
        Using TMM_V000.RPM;1 for ././BIGIP13115/i686/tmm-vadc-debug-13.1.1.5-1707.0.i686.rpm (tmm-vadc-13.1.1.5-1707.0.i686.rpm)

        1.25% done, estimate finish Sun Dec 01 09:58:00 2019
        98.76% done, estimate finish Sun Dec 01 09:58:27 2019
        Total translation table size: 0
        Total rockridge attributes bytes: 72463
        Total directory bytes: 135168
        Path table size(bytes): 304
        Max brk space used a3000
        399956 extents written (781 MB)
        Inserting md5sum into iso image…
        md5 = cce0625d016f8571974647453cc6fd78
        Inserting fragment md5sums into iso image…
        fragmd5 = e3e88cee8adb0fcb92fe92e3a465ceb2b49ee5c4d1e47e46e153d687dcce
        frags = 20
        Setting supported flag to 0
        done
        Moving repository ISO to thumb drive (this will take a while) …done
        Product setup complete.
        Flushing disk buffer (this may take a while)… done

4. When the script completes, unmount the USB media;

        # umount /mnt/cd

    If you are having trouble unmounting the disk, run the following to see which user is using it and then kill the process;

        # fuser /mnt/cd
        # fuser -k /mnt/cd
        # umount /mnt/cd


B. Boot F5 using the USB media

1. Boot F5 so that it can boot into Maintenance Operating System (MOS) from the USB

2. Select the default terminal emulation (vt100)

3. The following command will delete all data present in the F5 system;

        # diskinit --style volumes

4. The following command will install the software;

        # image2disk --format=volumes --nosaveconfig --nosavelicense

5. After the installation, remove the USB and reboot

---

###  Install using existing ISO stored in F5

If the system can still boot and if you can upload the ISO in `/shared/images`, then do the following to do a clean install;
```
# image2disk --format=volumes --nosaveconfig /shared/images/BIGIP-13.1.1.5-0.0.3.iso
```
