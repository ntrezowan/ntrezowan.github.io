---
layout: post
---


### A. Install required packages
1. Install Pip

        # curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
        # python get-pip.py --user

2. Install Ansible
          
         # python -m pip install ansible

3. Install F5 Modules (v1) for Ansible and F5 SDK for Python
    
        # ansible-galaxy collection install f5networks.f5_modules
        # pip install f5-sdk

---

### B. Create the playbook

The following playbook will check if the unit is in standby state and if so, then it will do the following;
1. Prompt for the BIGIP version that you want to install (assuming ISO is located in /Users/xxx/Downloads/)
2. Verify the running configuration
3. Download a configuration backup to user's Downloads folder
4. Download a qkview to user's Downloads folder
5. Upload the ISO image from user's Download folder to BIGIP (in /shared/images)
6. Install the ISO to a partition, make the partition as active on boot and then it will restart to the new version.

        ---
        # upgrade.yaml
        
        - name: Upgrade F5
          hosts: all
          connection: local
          gather_facts: false
          collections:
            - f5networks.f5_modules

          vars:
            provider:
              server: FQDN/IP
              server_port: 443
              user: ansible
              password: 
              validate_certs: no

          vars_prompt:
            - name: Choose version to install
              prompt: "Type ISO version (i.e. 13.1.3-0.0.11)"
              private: no

          tasks:

            # Pre upgrade tasks
            - name: "Task 1: Check failover state"
              shell: tmsh show sys failover | awk '{print $2}'
              register: failover_state

            - block:
              - name: "Task 2: Check running config"
                command: tmsh load sys config verify

              - name: "Task 3: Waiting for configuration to load"
                wait_for:
                  timeout: 30
                delegate_to: localhost

              - name: "Task 4: Get current time"
                command: date "+%Y_%m_%d_%H%M"
                register: date

              - name: "Task 5: Download a new UCS"
                bigip_ucs_fetch:
                  src: "{{ inventory_hostname + '-' + date.stdout +  '-backup.ucs' }}"
                  dest: "{{ '/Users/xxx/Downloads/' + inventory_hostname + '-' + date.stdout +  '.ucs' }}"
                  provider: "{{provider}}"
                delegate_to: localhost

              - name: "Task 6: Download a qkview"
                bigip_qkview:
                  asm_request_log: yes
                  exclude:
                    - audit
                    - secure
                  dest: "{{ '/Users/xxx/Downloads/' + inventory_hostname + '-' + date.stdout +  '.qkview' }}"
                  provider: "{{ provider }}"
                delegate_to: localhost

              - name: "Task 7: Upload image to F5"
                bigip_software_image:
                 image: "{{ '/Users/xxx/Downloads/BIGIP-' + version  + '.iso' }}"
                 provider: "{{provider}}"
                delegate_to: localhost

              - name: "Task 8: Wait For Confirmation"
                pause:
                  prompt: "Press a key to continue upgrading F5..."

              # Upgrade
              - name: "Task 9: Install BIG-IP"
                bigip_software_install:
                  image: "{{ 'BIGIP-' + version  + '.iso' }}"
                  state: activated
                  volume: "HD1.2"                                     
                  provider: "{{provider}}"
                delegate_to: localhost
                async: 45
                poll: 0

              when: failover_state.stdout  == 'standby'

---

### Run the playbook

        # ansible-playbook -i bigip_hosts upgrade.yaml 
