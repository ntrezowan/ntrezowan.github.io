---
title: "Building F5 in AWS using CloudFormation"
comments: false
description: "Building F5 in AWS using CloudFormation"
keywords: "f5, ec2, aws, create, build, configure, deploy, cloudformation, stack"
published: true

---


### A. Get the latest AMI list of F5 images
1. Go to [https://github.com/F5Networks/f5-aws-cloudformation](https://github.com/F5Networks/f5-aws-cloudformation)

2. Browse to `AMI Maps` folder, choose the version you want to use and download the JSON file of either BYOL (Bring Your Own License) or PAYG (Pay As You Go). This is the AMI list that will be added in the CloudFormation template

3. If you want to use an older version, use the AWS Matrix ([https://github.com/F5Networks/f5-aws-cloudformation/blob/master/aws-bigip-version-matrix.md](https://github.com/F5Networks/f5-aws-cloudformation/blob/master/aws-bigip-version-matrix.md)) to find out the `Release Tags` of the version you want. Then go to [https://github.com/F5Networks/f5-aws-cloudformation](https://github.com/F5Networks/f5-aws-cloudformation) and use the `Tags` under `Master` branch to find the `Release Tag` you have chosen. Now go to the `AMI Maps` folder and you will see the JSON file of the older versions

---

### B. Create CouldFormation Template
1. Go to [https://github.com/F5Networks/f5-aws-cloudformation](https://github.com/F5Networks/f5-aws-cloudformation)

2. Browse to `supported` folder, choose either Standalone, Failover or Autoscale and then choose the number of network interfaces you needed for the F5. Now choose BYOL, or PAYG and save the template file (for example, f5-existing-stack-byol-n-nic-bigip.template which has been used for this configuration) as a local text file (f5-cf.txt)

3. Open `f5-cf.txt` and search for `BigipRegionMap`. Replace all the region declaration with the AMI list obtained previously

---

### C. Create EC2 instance
1. Go to `AWS Management Console > CloudFormation`. Click on `Create Stack`. Choose `Upload a template file` under `Specify Template`. Upload `f5-cf.txt` ([Sample f5-cf.txt](http://ntrezowan.github.com/shared/f5-cf.txt)), click `Next` and configure as following;

        Stack Name: f5-cf

        VPC: vpc-0223567fe5974c63 (Choose the VPC where F5 will reside)
        Management Subnet AZ1: subnet-0d3a58dfc40277fa (Choose the subnet ID which will be used for management interface, AWS will dynamically assign the IP)
        Subnet1 in AZ1: subnet-0d3a58dfc40277fb (Choose the subnet ID for additional tmm interface, AWS will dynamically assign the IP)
        Subnet1 in AZ2: subnet-0d3a58dfc40277fc (Choose the subnet ID for additional tmm interface, AWS will dynamically assign the IP)
        Number Of Additional NICs: 3 (Adding three more interfaces)
        Additional NIC Location: subnet-0d3a58dfc40277fd, subnet-0d3a58dfc40277fe, subnet-0d3a58dfc40277ff (adding 3 additional subnet ID to have three more tmm interfaces)
        Provision Public IP addresses for the BIG-IP interfaces: No (Choose Yes if you want these interfaces to have public IP)

        BIG-IP Image Name: AllTwoBootLocation (If you do not need to upgrade F5 in future, you can choose AllOneBootLocation. If you prefer to provision LTM only, then choose image name that starts with LTM*)
        AWS Instance Size: m5.4xlarge (You need m5.4xlarge or larger since this instance type supports up to 8 interfaces. Check instance type in https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html to know what type of instance you need to support your required network interfaces)

        License Key 1: XXXXX-XXXXX-XXXXX-XXXXX-XXXXXXX (Input your license key)
        SSH Key: f5-aws.pem (Choose the SSH that will be used to SSH to F5)
        Source Address(es) for Management Access: 10.0.1.0/28 (Only these IPs are allowed to SSH to F5)
        Source Address(es) for Web Application Access (80/443): 10.0.1.0/28 (Only these IPs are allowed to reach the Configuration Utility)
        NTP Server: ntp1.example.com,ntp2.example.com,ntp3.example.com
        Timezone (Olson): US/Eastern
        BIG-IP Modules: ltm:medium, asm:nominal,afm:nominal,apm:nominal (specify resource provisioning here)

2. Click `Next` (unless you need to specify the IAM role to run this stack in CloudFormation) and finally click `Create stack`

4. It will create an EC2 instance called `Big-IP:f5-cf` and after 10-15 minutes, you will be able to access the Configuration Utility using the IP of management interface

---

Note: You cannot encrypt the disk volume of the EC2 instance if you use CloudFormation. If you need to encrypt the volume, then use [https://github.com/f5devcentral/f5-bigip-image-generator/](https://github.com/f5devcentral/f5-bigip-image-generator/). 
