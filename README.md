# linux-overlay

Dims your screen below the minimum hardware brightness with a transparent black overlay. Built with Electron for Ubuntu GNOME (Wayland/X11).

- Clicks pass straight through the overlay, and it never takes keyboard focus
- Always on top, and follows you across workspaces
- Set the dim level (0–70%) or quit from the moon icon in the top bar

## Run

```bash
npm install
./launch.sh
```

## Add it to the Windows (Super) key menu

After this, press the **Windows key**, type **"Dim"** and press Enter to start it.

1. Clone the repo and install dependencies (only needed once):

   ```bash
   git clone https://github.com/lakshya404stc/linux-overlay.git
   cd linux-overlay
   npm install
   chmod +x launch.sh
   ```

2. From inside the `linux-overlay` folder, create the menu entry:

   ```bash
   cat > ~/.local/share/applications/dim-overlay.desktop <<EOD
   [Desktop Entry]
   Type=Application
   Name=Dim Overlay
   Comment=Dim screen below minimum brightness
   Exec=$PWD/launch.sh
   Icon=weather-clear-night
   Terminal=false
   Categories=Utility;
   Keywords=dim;brightness;dark;overlay;
   EOD
   update-desktop-database ~/.local/share/applications
   ```

   `$PWD` fills in the folder's full path, so run it from inside the repo. If you move the folder later, run this step again.

3. Press the Windows key and type **"Dim"**. If it doesn't show up, log out and back in once.
   Optional: right-click it and choose **Pin to Dash**.

**Using it:** click the moon icon in the top-right of the top bar to pick a dim level or choose **Quit**.

**Start automatically at login (optional):**

```bash
mkdir -p ~/.config/autostart
cp ~/.local/share/applications/dim-overlay.desktop ~/.config/autostart/
```

**Remove it from the menu:**

```bash
rm ~/.local/share/applications/dim-overlay.desktop ~/.config/autostart/dim-overlay.desktop
```

## Notes

- Runs through XWayland (`--ozone-platform=x11`), because native Wayland doesn't allow always-on-top or click-through windows.
- Electron's `setIgnoreMouseEvents` doesn't work under XWayland. `clickthrough.py` sets an empty X11 input shape (and a no-focus hint) instead.
- Needs `/usr/bin/python3`, and the AppIndicator extension for the top-bar icon (enabled by default on Ubuntu).
- Emergency kill: `pkill -9 -f 'overlay/node_modules/electron'`
