# Cc rules — Thunderbird extension

Conditional automatic Cc. When you press Send on a message to someone on your
watch list, it checks whether the person you nominated is copied. If not, it
either adds them or asks you first.

Unlike the Outlook attempt, this needs no hosting, no admin approval and no
GitHub. It installs straight into Thunderbird on your Mac.

## Install

1. Thunderbird → **Tools → Add-ons and Themes**.
2. Gear icon (top right) → **Install Add-on From File…**
3. Choose `cc-rules.xpi`.
4. If Thunderbird refuses because the add-in is not signed, see below.

### If installation is refused as unsigned

Thunderbird lets you turn the signature requirement off, unlike Firefox.

**Settings → General →** scroll to the bottom → **Config Editor…** → search
for `xpinstall.signatures.required` → set it to **false**. Then install again.

Alternative without changing that setting: **Tools → Developer Tools → Debug
Add-ons → Load Temporary Add-on…** and pick `manifest.json` from the unzipped
folder. This works immediately but is forgotten when Thunderbird restarts.

## Set it up

**Tools → Add-ons and Themes →** find *Cc rules* → **Options** (or the ⋯ menu →
Preferences). Fill in:

- **Always copy** — the address to add, e.g. your supervisor.
- **When writing to** — one or more addresses that trigger the rule.
- **If they are not copied** — remind you, or add them silently.
- **Where to look** — the To line only, or To, Cc and Bcc.

Save. The settings take effect on the next message; no restart needed.

## What happens at send time

In **remind** mode a small window appears with three choices:

| Button | Result |
|---|---|
| Add to Cc and send | address added, message goes out |
| Send without | message goes out unchanged |
| Back to message | nothing is sent, you return to the compose window |

Closing the window with the red button behaves like *Back to message* — it
will never send something you did not confirm.

In **auto** mode nothing appears; the address is added silently.

## Testing

Set the copy address and a watched address to two accounts you control, then:

| Test | Send to | Expected |
|---|---|---|
| A | the watched address | prompt appears (or Cc added) |
| B | watched address, copy address already in Cc | nothing happens |
| C | anyone else | nothing happens |
| D | rule switched off in Options | nothing happens |

Check the Sent folder to confirm what actually went out.

## Limits

- **This Mac, this app.** Mail sent from your phone or from Outlook is not
  checked. That was the accepted trade-off.
- **Exact address matching.** Aliases count as different addresses; add each
  one you use to the watch list.
- **Fails open.** If the extension errors while reading its settings, the
  message sends unchecked rather than being blocked.

## Editing the code

`background.js` holds the send-time logic, `options.*` the settings page,
`prompt.*` the reminder window. After editing, re-zip the folder contents (not
the folder itself) and rename to `.xpi`, or use Load Temporary Add-on while
iterating.
