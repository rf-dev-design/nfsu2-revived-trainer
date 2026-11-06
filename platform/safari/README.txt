U2 Revived Trainer — Safari build (EXPERIMENTAL, untested)

Safari can't load a web extension from a zip. It has to be wrapped in a
small macOS app with Xcode first:

  1. Unzip this folder on a Mac with Xcode installed.
  2. In Terminal:
       xcrun safari-web-extension-converter /path/to/this/folder \
         --app-name "U2 Revived Trainer" --macos-only --no-open
  3. Open the generated Xcode project, choose "Sign to Run Locally",
     and press Run.
  4. Safari → Settings → Advanced → enable "Show features for web developers",
     then Develop → "Allow Unsigned Extensions".
  5. Safari → Settings → Extensions → enable "U2 Revived Trainer"
     and allow it on nfsu2.xyz.

Heads-up: the game itself officially targets Chrome and Firefox, and this
extension relies on page-world content scripts ("world": "MAIN"). If either
doesn't work in your Safari version, use a Chromium browser instead.
