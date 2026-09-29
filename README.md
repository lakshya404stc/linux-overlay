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

## Add to the app launcher (Super key → "Dim")

```bash
cat > ~/.local/share/applications/dim-overlay.desktop <<EOD
[Desktop Entry]
Type=Application
Name=Dim Overlay
Exec=$PWD/launch.sh
Icon=weather-clear-night
Terminal=false
Categories=Utility;
EOD
```

## Notes

- Runs through XWayland (`--ozone-platform=x11`), because native Wayland doesn't allow always-on-top or click-through windows.
- Electron's `setIgnoreMouseEvents` doesn't work under XWayland. `clickthrough.py` sets an empty X11 input shape (and a no-focus hint) instead.
- Needs `/usr/bin/python3`, and the AppIndicator extension for the top-bar icon (enabled by default on Ubuntu).
- Emergency kill: `pkill -9 -f 'overlay/node_modules/electron'`
