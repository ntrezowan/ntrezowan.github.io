---
title: "Configuring GPG Symmetric/Asymmetric Key for File Transfer"
comments: false
description: "Configuring GPG Symmetric/Asymmetric Key for File Transfer"
keywords: "gpg, encryption, decryption, symmetric, asymmetric, public, private, file, transfer"
published: true

---

### Symmetric key encryption 
1. Create a sample text file which will be encrypted;

        # echo Plain Text > input.txt
        
        # cat input.txt 
        Plain Text

2. Encrypt `input.txt` file;

        # gpg -c input.txt
        gpg: directory `/home/user1/.gnupg' created
        gpg: new configuration file `/home/user1/.gnupg/gpg.conf' created
        gpg: WARNING: options in `/home/user1/.gnupg/gpg.conf' are not yet active during this run

    If you are using GPG for the first time on this server, it will ask to set a passphrase. Choose a passphrase (this will be the symmetric key) and it will confirm that the key has been created;

        gpg: keyring `/home/user1/.gnupg/pubring.gpg' created

    The newly created key is located here;
        
        # ls ~/.gnupg/
        gpg.conf  private-keys-v1.d  pubring.gpg  random_seed  S.gpg-agent

3. The encrypted file will have `.gpg` extension. Check if the file is encrypted;

        # cat input.txt.gpg 
        �g�E|u�X��+R��l��*�u����t       �Cy��
        ���rg�s�6d

    Now you can send this file to anyone and only they can decrypt it if they know the symmetric key/passphrase.

4. To decrypt the file, do the following;

        # gpg -o output.txt input.txt.gpg 
        gpg: CAST5 encrypted data
        gpg: encrypted with 1 passphrase
        gpg: WARNING: message was not integrity protected

5. To verify if the file has decrypted correct, do the following;  

        # cat output.txt
        Plain Text

---

### Asymmetric Key encryption 
1. To use asymmetric encryption, we first need to create a public-private key pair. Run the following to create a pair;

        # gpg --gen-key
        gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
        This is free software: you are free to change and redistribute it.
        There is NO WARRANTY, to the extent permitted by law.

        Please select what kind of key you want:
           (1) RSA and RSA (default)
           (2) DSA and Elgamal
           (3) DSA (sign only)
           (4) RSA (sign only)
        Your selection? 1
        RSA keys may be between 1024 and 4096 bits long.
        What keysize do you want? (2048) 
        Requested keysize is 2048 bits
        Please specify how long the key should be valid.
                 0 = key does not expire
              <n>  = key expires in n days
              <n>w = key expires in n weeks
              <n>m = key expires in n months
              <n>y = key expires in n years
        Key is valid for? (0) 0
        Key does not expire at all
        Is this correct? (y/N) y

        GnuPG needs to construct a user ID to identify your key.

        Real name: user1
        Email address: user1@example.com
        Comment: 
        You selected this USER-ID:
            "user1 <user1@example.com>"

        Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? O
        You need a Passphrase to protect your secret key.

    At this point it will ask for a passphrase. This is the passphrase which you will use to decrypt encrypted files send to you along with your private key. You should not share this passphrase and private key with anyone.

        We need to generate a lot of random bytes. It is a good idea to perform
        some other action (type on the keyboard, move the mouse, utilize the
        disks) during the prime generation; this gives the random number
        generator a better chance to gain enough entropy.
        We need to generate a lot of random bytes. It is a good idea to perform
        some other action (type on the keyboard, move the mouse, utilize the
        disks) during the prime generation; this gives the random number
        generator a better chance to gain enough entropy.
        gpg: /home/user1/.gnupg/trustdb.gpg: trustdb created
        gpg: key C56171B8 marked as ultimately trusted
        public and secret key created and signed.

        gpg: checking the trustdb
        gpg: 3 marginal(s) needed, 1 complete(s) needed, PGP trust model
        gpg: depth: 0  valid:   1  signed:   0  trust: 0-, 0q, 0n, 0m, 0f, 1u
        pub   2048R/C56171B8 2019-12-18   
              Key fingerprint = 148D B70C 7D30 5DED 6EDC  FB54 F90F 870A C561 71B8
        uid                  user1 <user1@example.com>
        sub   2048R/78C8F6D8 2019-12-18   

    The newly created pair is located here;
    
        # ls ~/.gnupg/
        gpg.conf  private-keys-v1.d  pubring.gpg  pubring.gpg~  random_seed  secring.gpg  S.gpg-agent  trustdb.gpg

2. To see all the GPG keys;

        # gpg --list-keys
        /home/user1/.gnupg/pubring.gpg
        -----------------------------------
        pub   2048R/C56171B8 2019-12-18   
        uid                  user1 <user1@example.com>
        sub   2048R/78C8F6D8 2019-12-18   

3. To encrypt `input.txt` with this new asymmetric key, do the following;

        gpg --encrypt --recipient user1@example.com input.txt

4. To decrypt a file using your private key and passphrase, do the following;

        # gpg --output output.txt --decrypt input.txt.gpg 

        You need a passphrase to unlock the secret key for
        user: "user1 <user1@example.com>"
        2048-bit RSA key, ID 78C8F6D8, created 2019-12-18   (main key ID C56171B8)

        gpg: encrypted with 2048-bit RSA key, ID 78C8F6D8, created 2019-12-18   
              "user1 <user1@example.com>"

5. If you want to export your public key, do the following; 

        gpg --armor --output public_key.cer --export 'user1@example.com'

6. If you want to export your private key for backup purposes or anything else, do the following;  

        # gpg --armor --output private_key.asc --export-secret-keys 'user1@example.com'

7. To check when the key will expire;  

        # gpg --edit-key user1@example.com
        gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
        This is free software: you are free to change and redistribute it.
        There is NO WARRANTY, to the extent permitted by law.

        Secret key is available.

        pub  2048R/C56171B8  created: 2019-12-18  expires: never       usage: SC  
                             trust: ultimate      validity: ultimate
        sub  2048R/78C8F6D8  created: 2019-12-18  expires: never       usage: E   
        [ultimate] (1). user1 user1@example.com

8. To check all contents of the public key ring;

        # gpg --check-sigs
        /home/user1/.gnupg/pubring.gpg
        -----------------------------------
        pub   2048R/C56171B8 2019-12-18   
        uid                  user1 <user1@example.com>
        sig!3        C56171B8 2019-12-18  user1 <user1@example.com>
        sub   2048R/78C8F6D8 2019-12-18  
        sig!         C56171B8 2019-12-18  user1 user1@example.com

9. To check all contents of the private key ring;

        # gpg --list-secret-keys
        /home/user1/.gnupg/secring.gpg
        -----------------------------------
        sec   2048R/C56171B8 2019-12-18  
        uid                  user1 <user1@example.com>
        ssb   2048R/78C8F6D8 2019-12-18  

