---
title: "Introducing Linux"
comments: false
description: "Introducing Linux"
keywords: "linus torvalds, email, linux, kernel, first"
---
**August 25, 1991**

*From: torvalds@klaava.Helsinki.FI (Linus Benedict Torvalds)*  
*Newsgroups: comp.os.minix*  
*Subject: What would you like to see most in minix?*  
*Summary: small poll for my new operating system*  
*Message-ID: <1991aug25 .205708.9541=".205708.9541" klaava.helsinki.fi="klaava.helsinki.fi">*  
*Date: 25 Aug 91 20:57:08 GMT*  
*Organization: University of Helsinki*  
  

Hello everybody out there using minix -  
I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu) for 386(486) AT clones. This has been brewing since april, and is starting to get ready.I'd like any feedback on things people like/dislike in minix, as my OS resembles it somewhat (same physical layout of the file-system(due to practical reasons) among other things). I've currently ported bash(1.08) and gcc(1.40),and things seem to work.This implies that I'll get something practical within a few months, andI'd like to know what features most people would want. Any suggestions are welcome, but I won't promise I'll implement them :-)

Linus (torvalds@kruuna.helsinki.fi)  

PS. Yes - it's free of any minix code, and it has a multi-threaded fs. It is NOT protable (uses 386 task switching etc), and it probably never will support anything other than AT-harddisks, as that's all I have :-(.

___

**October 05, 1991**

*From: torvalds@klaava.Helsinki.FI (Linus Benedict Torvalds)*  
*Newsgroups: comp.os.minix*  
*Subject: Free minix-like kernel sources for 386-AT*  
*Message-ID: <1991oct5 .054106.4647=".054106.4647" klaava.helsinki.fi="klaava.helsinki.fi">*  
*Date: 5 Oct 91 05:41:06 GMT*  
*Organization: University of Helsinki*  
  

Do you pine for the nice days of minix-1.1, when men were men and wrote their own device drivers?  
Are you without a nice project and just dying to cut your teeth on a OS you can try to modify for your needs? Are you finding it frustrating when everything works on minix? No more all-nighters to get a nifty program working? Then this post might be just for you :-)  

As I mentioned a month(?)ago, I'm working on a free version of a minix-lookalike for AT-386 computers. It has finally reached the stage where it's even usable (though may not be depending on what you want), and I am willing to put out the sources for wider distribution. It is just version 0.02 (+1 (very small) patch already), but I've successfully run bash/gcc/gnu-make/gnu-sed/compress etc under it. Sources for this pet project of mine can be found at nic.funet.fi (128.214.6.100) in the directory /pub/OS/Linux. The directory also contains some README-file and a couple of binaries to work under linux (bash, update and gcc, what more can you ask for :-). Full kernel source is provided, as no minix code has been used. Library sources are only partially free, so that cannot be distributed currently. The system is able to compile "as-is" and has been known to work. Heh. Sources to the binaries (bash and gcc) can be found at the same place in /pub/gnu.
