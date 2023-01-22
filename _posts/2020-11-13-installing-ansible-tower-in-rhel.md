---
layout: post
---


1. Install EPEL Repository;
        
        $ dnf install https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

2. Install Ansible;

        $ yum install ansible 

3. Download Ansible Tower;

        $ mkdir /tmp/ansible-tower-setup
        $ cd /tmp/ansible-tower-setup
        $ curl -k -O https://releases.ansible.com/ansible-tower/setup/ansible-tower-setup-latest.tar.gz
        $ tar xvf ansible-tower-setup-latest.tar.gz
        $ cd /ansible-tower-setup-x.x.x-x

5. Modify `inventory` file and add the following;

        $ vi inventory
        
        [tower]
        server1.example.com
        server2.example.com
        
        [all:vars]
        admin_password=''
        
        [database]
        pg_database='awx'
        pg_username='awx'
        pg_password=''

6. Install Ansible Tower (this will run install.yml playbook)

        $ ./setup.sh

7. Copy your certificate/key to the following location;

        site_certificate -> /etc/tower/tower.cert
        site_key -> /etc/tower/tower.key

8. Restart Ansible Tower;

        $ ansible-tower-service restart

9. Go to [https://IP_ADDRESS](https://IP_ADDRESS) and login with admin user and use your Red Hat Satellite credentials to install the license.
