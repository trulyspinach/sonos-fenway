# Sonos Fenway

![img](firmware/rootfs/57.10-25140/opt/htdocs/img/icon-S1.png)
![img](firmware/rootfs/57.10-25140/opt/htdocs/img/icon-S3.png)
![img](firmware/rootfs/57.10-25140/opt/htdocs/img/icon-Sub.png)

**Everything we know about Fenway**

For general information, hacks about other class of Sonos devices please find them [here](https://github.com/Sonoisseurs/sonor).

## What?

Sonos Fenway(Model 0x08) are a series of Sonos's product launched starting from 2011, including:

* Sonos Bridge[*?]
* Sonos Sub(Gen 1)[Anvil]
* Sonos Play:1[AMOEBA]
* Sonos Play:3[?]

This is not an exhaustive list.

These models support both S1, S2 controller app and all powered by [MPC8314](https://www.nxp.com/docs/en/data-sheet/MPC8314EEC.pdf).

# Toolchain

GCC cross compile toolchain can be set up to produce executable for Fenway devices, the screenshot below shows a Sonos Play:1 running Python3:

![img](misc/python3.7/running_py.png)

A Python3.7 with minimum standard library files required to get to REPL can be found [here](misc/python3.7/).

__TODO: more detail on setting up toolchain.__

# Custom Firmware

A proof of concept for custom firmware was uploaded [here](https://github.com/trulyspinach/sonos-fenway/tree/main/custom).

This firmware aim to make subsequence researches easier and features the following:
* SSH and telnet for `root` user enabled by default with a password: `fenway`.
* Dumping system over http server via: `http://<IP>:1400/root/<path to file>`. e.g. `http://<IP>:1400/root/VERSION`
* Normal access to Sonos services and playback.
* __Optimized setup ringtone audio.__

These firmware can be flashed to the device over tftp using the [`upgrade` command in U-boot](https://github.com/trulyspinach/sonos-fenway#upgrade).

# Getting Shell Access

In general there are two ways for you to get root shell in these devices: UART and telnet. However, both are disabled by default in production devices. You are lucky if whichever one you are trying to hack are running diagnostic firmware, which gives you root shell over UART by default. In most cases where your device are running production firmware, good news is you can flash a diagnostic firmware at uboot(see sections below for detail) to enable shell.

So if by some chance you are in a root shell, add these flags to MDP to make subsequence access permanent:
* `MDP_AUTH_FLAG_KERNEL_PRINTK_ENABLE`
* `MDP_AUTH_FLAG_CONSOLE_ENABLE`

This can be done via: 
`#mdputil -wfF 3`
or for newer firmwares:
```
#mdputil -wfC 1
#mdputil -wfP 1
```

# U-boot
Accessing the U-boot shell is as easy as hooking up the UART. The connector footprint is kinda obvious so I won't cover details here, just look for a 4 pin JST 1.25mm footprint. If you're really having a hard time locating them try searching around the internet for images. You do need to spam key presses right after device power on to interrupt autoboot.

## sonosboot
Fenway uboot have a command `sonosboot` that warp around memory booting with a version(`bootgen`) and integrity check to determine which section(`bootsect`) to boot. If you want to boot the least fresh section do `sonosboot fallback`.

## upgrade
You can load a partition image(not upgrade `.upd` file) via the `upgrade` command in uboot. The image is sent to the device over `tftp` and IP of both peers are statically assigned by uboot env variables(see `printenv`). The simplest setup is connect your device to a `tftp` server using the Ethernet port and set server's IP to `169.254.2.2` then run:
```
=> upgrade <partition> <file_name>
```
Partition name can be obtained via running `ptable`. 

This can also help you to gain shell access to the device by flashing a diagnostic firmware then set flags using `mdputil`. Grab a dump from `firmware/dump` and serve them using `tftp`.

It also appears that the uboot does not perform any integrity check for the provided image, so this could protentially be a nice way to upload custom firmware.

# Q&A
### Where is the part that handle Sonos services in the root fs?
Look for `anacapad`. This huge binary handles all Sonos's related services including accessing music services, serving <ip>:1400, LED control and audio playback.
  
### How can I test with modified files that are in rootfs which is mounted as readonly?
You can `wget` or `ftpget` the file to `jffs` then bind mount the target path: `mount --bind <your_file> <path to replace>`

### How do I change device's serial number?
`mdputil -wfs <serial number>`
  
Doing so will make your signature invaild so don't do this just for fun. 
  
# Why?

While playing around with some poor Sonos Fenway devices that refuses to work due to firmware issues. I am able to gain a lot of in depth understanding of Sonos's software stack so I will try to organize what I know and share them in this repository. Hope these can be helpful and you are more than welcomed to correct me or share your knowledge about these devices by contributing to this repo!

Feel free to open up issues or reach me out!

# Bonus
[Listen to the pin!](firmware/rootfs/57.10-25140/opt/buzzers/100.mp3)
