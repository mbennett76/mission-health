# Mission Health — setup guide

About 45 minutes, start to finish. Do the parts in order.

---

## Part A — Put the project on your Mac and preview it (10 min)

1. Unzip **mission-health-app.zip** into a normal folder, e.g. `~/Projects/mission-health`.
   **Not** in a Dropbox "online-only" folder; that caused the git problems on Come Follow Me.
2. Save **mission-health-seed.json** in `~/Documents`, **outside** the project folder. It holds the provider and missionary data and must never go to GitHub. The project's `.gitignore` also blocks it.
3. Open Terminal and run:
   ```
   cd ~/Projects/mission-health
   npm install
   npm run dev
   ```
4. Open the link it prints (usually http://localhost:5173/mission-health/).
   You'll see an orange **Preview mode** bar. Choose the seed file there and click around. Nothing is saved in preview mode.
5. Press `Ctrl + C` in Terminal to stop it.

---

## Part B — Firebase (signed in as marc@bennettdental.com) (15 min)

1. Go to **console.firebase.google.com** → **Create a project** → name it `mission-health` → turn **off** Google Analytics → **Create**.
2. **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Authentication → Users → Add user**: `marc@bennettdental.com` and a password of your choice. This is your own sign-in.
4. **Authentication → Settings → Authorized domains → Add domain**: `mbennett76.github.io`
5. **Build → Firestore Database → Create database** → choose **Production mode** → location **northamerica-northeast1 (Montréal)** → **Enable**.
6. In Firestore open the **Rules** tab. Delete what's there, paste the whole contents of `firestore.rules` from the project folder, then click **Publish**.
7. Click the **gear ⚙️ → Project settings → General**, scroll to **Your apps**, and click the **web icon `</>`**. Nickname `mission-health` (leave Hosting unticked) → **Register app**.
8. It shows a `firebaseConfig = { … }` block. Open `src/firebase.js` in the project and replace each `PASTE…` value with the matching value from that block. Save the file.

> These keys are meant to be public. The rules from step 6 protect the data, not the keys.

---

## Part C — GitHub and the live site (10 min)

1. On github.com, signed in as **mbennett76**: **New repository** → name **`mission-health`** (exactly) → **Public** (the code contains no mission data) → leave all boxes unticked → **Create**.
2. In the new repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. In Terminal:
   ```
   cd ~/Projects/mission-health
   git init
   git add .
   git commit -m "Phase 1"
   git branch -M main
   git remote add origin https://github.com/mbennett76/mission-health.git
   git push -u origin main
   ```
4. Open the repo's **Actions** tab and wait for the green check (about 2 minutes).
   The app is now at **https://mbennett76.github.io/mission-health/**

---

## Part D — First sign-in, load the data, add people (10 min)

1. Open the app and sign in as marc@bennettdental.com. Your admin access sets itself up on this first sign-in.
2. **Settings → Data**: keep **Add new only** selected, then choose `mission-health-seed.json`. You should see about 360 records imported.
3. **Settings → Find exact map pins.** It looks up every address on the map, one per second, so it takes about 4 minutes. Leave the page open. Anything it can't find is listed at the end; fix those addresses later in the app.
4. **Settings → Add a person** for each of these, with a temporary password (8+ characters):
   - Sister Natasha Bennett: `NIBennett78@churchofjesuschrist.org`, **Can edit**
   - Elder Jeffrey Bondy: `jbondy@churchofjesuschrist.org`, **Can edit**
   - Sister Carolyn Bondy: `cbondy@churchofjesuschrist.org`, **Can edit**
   - (later, if wanted) President / Sister Matheson: **View only**

   Give each person their temporary password. The first time they sign in, the app makes them choose their own.
5. **Test the reset email:** click **Send reset** next to Natasha. Ask her to check her inbox *and junk folder*. If it landed in junk, mark it "not junk".
6. **Each person, on their phone:** open the link in Safari → **Share → Add to Home Screen**. After one sign-in they stay signed in, and the app keeps working with poor signal.
7. Each person: **Settings → My zones**. Type the zones they cover, so the map shows their areas first.
8. On transfer day: **Transfers** tab → paste the list → check the changes → **Apply**.

---

## Future updates

When I send changed files, copy them into the same places in the project folder, then:
```
cd ~/Projects/mission-health
git add .
git commit -m "describe the change"
git push
```
The site updates itself in about 2 minutes. Phones pick up the new version the next time the app is opened.

## If someone is locked out
- **Settings → Send reset** emails them a link to choose a new password.
- If the email never arrives: in the Firebase console → **Authentication → Users**, delete their user. Then in the app, **Settings → Remove access** for their old entry, and add them again with a new temporary password.

## Backups
**Settings → Download backup** saves everything to a file. Do it after each transfer and keep the file in `~/Documents`, not the project folder.
