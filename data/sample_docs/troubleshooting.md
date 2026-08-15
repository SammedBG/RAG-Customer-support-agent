# TechNova SmartHome Hub — Troubleshooting Guide

## Quick Diagnostics

Before diving into specific issues, try these universal steps:

### Power Cycle (Fixes ~60% of issues)
1. Unplug the power adapter from the Hub
2. Wait **30 seconds**
3. Plug it back in
4. Wait for the LED to turn **solid blue** (ready state) — takes about 90 seconds

### Check LED Status
| LED Color | Pattern | Meaning |
|-----------|---------|---------|
| Solid Blue | Steady | Normal operation |
| Blinking Blue | Slow blink | Booting up / updating |
| Solid Green | Steady | Connected, no issues |
| Blinking Green | Fast blink | Pairing mode active |
| Solid Yellow | Steady | Warning — check app for details |
| Blinking Yellow | Slow blink | Firmware update in progress |
| Solid Red | Steady | Critical error — see Error Codes below |
| Blinking Red | Fast blink | Hardware failure — contact support |
| Purple | Pulsing | Factory reset in progress |
| Off | — | No power or hardware failure |

## Common Issues

### Issue: Hub Won't Connect to Wi-Fi

**Error Code**: E101

**Symptoms**: Hub LED stays yellow, app shows "No Network Connection"

**Solutions**:
1. **Check your router**: Ensure your Wi-Fi network is working (test with another device)
2. **Verify 2.4GHz band**: The Hub Lite only connects to **2.4GHz networks**. Hub Pro and Enterprise support both 2.4GHz and 5GHz
3. **Check distance**: Move the Hub within **10 meters** of your router
4. **Reset network settings**:
   - Open the TechNova app > Settings > Network > Reset Network
   - Or press and hold the **reset button** (small pinhole on back) for **5 seconds**
5. **MAC address filtering**: If your router uses MAC filtering, add the Hub's MAC address (found on the bottom label or in Settings > About)
6. **Channel congestion**: Try changing your router's Wi-Fi channel to a less congested one (1, 6, or 11 for 2.4GHz)

**If none of these work**: Your router's firmware may be incompatible. Check our [compatibility list](https://technova.com/router-compatibility) or contact support.

---

### Issue: Smart Devices Not Discovered

**Error Code**: E201

**Symptoms**: "No devices found" during device discovery scan

**Solutions**:
1. **Enable pairing mode** on the device you're trying to add (check the device's manual)
2. **Check protocol support**: Ensure your Hub model supports the device's protocol:
   - Hub Lite: Wi-Fi, Bluetooth only
   - Hub Pro/Enterprise: Zigbee, Z-Wave, Wi-Fi, Bluetooth, Thread
3. **Proximity**: During pairing, keep the device within **3 meters** of the Hub
4. **Interference**: Temporarily disable other Bluetooth/Zigbee devices during pairing
5. **Firmware check**: Update both the Hub and the device firmware to the latest version
6. **Factory reset the device**: Some devices need a fresh reset before they can pair with a new controller

**Special case — Zigbee devices**: If Zigbee devices aren't appearing:
- Ensure you have at least one **Zigbee router** device (most mains-powered Zigbee devices act as routers)
- Battery-powered Zigbee devices (sensors, remotes) are **end devices** and can sometimes be harder to pair
- Try pairing near the Hub, then move the device to its final location

---

### Issue: Automations Not Triggering

**Error Code**: E301

**Symptoms**: NovaFlow routines don't execute at the expected time or condition

**Solutions**:
1. **Check automation status**: Open NovaFlow > select the routine > ensure it's **Enabled** (green toggle)
2. **Verify conditions**: Review all trigger conditions — sometimes a condition is too specific:
   - Time triggers: Check timezone settings (Settings > System > Time Zone)
   - Device triggers: Ensure the trigger device is online and responding
   - Geofencing triggers: Ensure location permissions are enabled for the TechNova app
3. **Check action devices**: Each device in the action chain must be online and responsive
4. **Execution limits**: Free accounts are limited to **10 active automations**. Upgrade to Premium for unlimited
5. **Conflict detection**: Two automations may conflict. NovaFlow shows a ⚠️ warning icon if conflicts are detected
6. **Logs**: Check NovaFlow > History to see execution logs and any error messages

---

### Issue: Voice Commands Not Working

**Error Code**: E401

**Symptoms**: NovaVoice doesn't respond or misunderstands commands

**Solutions**:
1. **Wake word**: Say **"Hey Nova"** clearly. The wake word is not customizable
2. **Microphone check**: Ensure the microphone isn't muted (check the physical mute button on top of Hub Pro/Enterprise)
3. **Background noise**: NovaVoice works best in rooms with ambient noise below **60 dB**
4. **Supported commands**: Review the [voice command reference](https://technova.com/voice-commands)
5. **Language settings**: Currently supported languages:
   - English (US, UK, AU)
   - Spanish (Spain, Mexico)
   - French (France, Canada)
   - German
   - Japanese
6. **Re-train voice model**: Settings > Voice > Retrain Voice Model (takes ~2 minutes)

---

### Issue: Hub Running Slowly

**Error Code**: E501

**Symptoms**: App interface is laggy, automations execute with delay, device responses are slow

**Solutions**:
1. **Check device count**: Near the device limit? (50 for Lite, 200 for Pro)
   - View count: Settings > Devices > Total Connected Devices
2. **Clear cache**: Settings > System > Storage > Clear Cache
3. **Check for runaway automations**: A looping automation can consume resources
   - Look for automations that trigger each other in a cycle
4. **Network bandwidth**: Run a speed test — the Hub needs at least **10 Mbps** for optimal performance
5. **Background processes**: Disable unused integrations (Settings > Integrations > toggle off unused ones)
6. **Restart services**: Settings > System > Advanced > Restart Services (doesn't affect automations)

**If performance doesn't improve**: Consider upgrading to Hub Pro or Enterprise for more processing power.

---

## Error Codes Reference

| Code | Category | Description | Severity |
|------|----------|-------------|----------|
| E101 | Network | Wi-Fi connection failure | Medium |
| E102 | Network | Ethernet link down | Medium |
| E103 | Network | DNS resolution failure | Low |
| E104 | Network | Cloud connection timeout | Medium |
| E201 | Devices | Device discovery failure | Low |
| E202 | Devices | Device communication lost | Medium |
| E203 | Devices | Protocol mismatch | Low |
| E204 | Devices | Device firmware incompatible | Medium |
| E301 | Automation | Automation execution failure | Medium |
| E302 | Automation | Trigger condition error | Low |
| E303 | Automation | Action timeout | Medium |
| E401 | Voice | Voice recognition failure | Low |
| E402 | Voice | Command not supported | Low |
| E501 | Performance | High CPU usage | Medium |
| E502 | Performance | Low memory | High |
| E503 | Performance | Storage full | High |
| E601 | Security | Unauthorized access attempt | Critical |
| E602 | Security | Firmware integrity check failed | Critical |
| E701 | Hardware | Temperature warning (>70°C) | High |
| E702 | Hardware | Fan failure (Enterprise only) | High |
| E703 | Hardware | Power supply issue | Critical |

## Factory Reset

⚠️ **Warning**: A factory reset erases ALL data, settings, device pairings, and automations. This cannot be undone.

### How to Factory Reset
1. **Via App**: Settings > System > Advanced > Factory Reset > Confirm
2. **Via Hardware**: Press and hold the reset button for **15 seconds** until the LED turns **purple**
3. The Hub will restart and enter setup mode (LED blinks green)
4. Set up the Hub as new using the TechNova app

### Before You Reset
- **Export your settings**: Settings > System > Backup > Export to Cloud
- **Note your device list**: You'll need to re-pair all devices
- **Save automation screenshots**: Automations are NOT backed up to cloud (yet — coming in v4.3)

## Contact Support

If your issue isn't resolved:
- **In-App Chat**: Tap the 💬 icon in the TechNova app (24/7)
- **Email**: support@technova.com (response within 24 hours)
- **Phone**: 1-800-TECHNOVA (Mon-Fri 8AM-8PM EST)
- **Community Forum**: forum.technova.com
- **Enterprise customers**: Priority line at 1-800-TECHNOVA ext. 100 (24/7)

When contacting support, please have ready:
1. Your **Hub model** and **serial number** (bottom of device or Settings > About)
2. The **error code** (if applicable)
3. Your **firmware version** (Settings > About > Firmware)
4. A brief description of the issue and steps you've already tried
