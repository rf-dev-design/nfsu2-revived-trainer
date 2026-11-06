U2 Revived Trainer — Safari build (EXPERIMENTAL, partly tested on Safari 27.2)

Safari can't load a web extension from a zip. It has to be wrapped in a
small macOS app with Xcode first:

  1. Unzip this folder somewhere you'll keep it, on a Mac with Xcode installed.
  2. In Terminal:
       xcrun safari-web-extension-converter /path/to/this/folder \
         --app-name "U2 Revived Trainer" --macos-only --no-open \
         --project-location /path/to/output-folder
     A warning about "world" is expected and can be ignored.
  3. Open the generated .xcodeproj, choose "Sign to Run Locally", and press Run.
     Leave the built app where it is.
  4. Safari > Settings > Advanced: turn on "Show features for web developers".
  5. Turn on "Allow Unsigned Extensions" (Developer tab of Settings, or the
     Develop menu). Safari may turn this off when it restarts.
  6. Safari > Settings > Extensions: tick U2 Revived Trainer, then allow it on
     nfsu2.xyz. "Edit Websites" stays grayed out until the box is ticked.
  7. Reload nfsu2.xyz, press Play, then press F2 (or Fn+F2) in the game.

On a MacBook: PgDn is Fn+Down, PgUp is Fn+Up, End is Fn+Right and Delete is
Fn+Delete. There's no Insert key, so click the Infinite Nitrous row in the panel.

Not yet tested in Safari: Instant 200, brakes, jump, move forward, nitrous, save
and warp, and Lock Speed. If something doesn't work, use Chrome or Firefox.
