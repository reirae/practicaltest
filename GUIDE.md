# SSD Practical Exam — Full Guide (Q1–Q9)

This treats the whole paper as one project. Files referenced below are in the
`ssd-exam-project/` bundle — download and unzip it, then follow along.

Replace `2402725` throughout with your actual student ID, and the name/email
placeholders with your real ones, wherever the exam asks for them.

```
ssd-exam-project/
├── docker-compose.yml
├── gitserver.Dockerfile
├── sonar-project.properties
├── .github/workflows/pipeline.yml
└── webapp/
    ├── Dockerfile
    ├── app.js              (Express app + password validation logic)
    ├── server.js           (starts https:443 + http:8080)
    ├── package.json
    ├── eslint.config.mjs
    ├── db/
    │   ├── init.sql
    │   └── 100k-most-used-passwords-NCSC.txt
    ├── public/
    │   ├── index.html      (Q4.1 login form)
    │   ├── signup.html     (Q4.6 create account + Q4.2 frontend validation)
    │   ├── welcome.html    (Q4.8)
    │   └── validate.js     (Q4.2 frontend password check)
    └── tests/
        ├── integration.test.js
        └── ui.test.js
```

---

## Q1 — docker-compose.yml with a web server

The `webapp` service in `docker-compose.yml` **is** the web server (per Q4's
"you can use other web application container to replace nginx" — one Node
container does double duty instead of running nginx + app separately, keeping
things simpler per Q4.11's "no marks for unnecessary complexity").

**Login credentials for Q1/Q7 ("Config the username as admin, password
2402725@sit...")** — this phrasing matches SonarQube's admin account, not a
custom login on your own app (there's no such requirement elsewhere in the
paper). Set this when you first log into SonarQube in Q7 (My Account →
change password). If your version of the paper genuinely wants a login on
the *web app itself* using that exact username/password, add a hardcoded
check in `app.js`'s `/login` route — but there's no such route required
elsewhere in Q4, so don't over-build this.

---

## Q2 — Bring it up, generate a self-signed cert, verify HTTPS

Generate the cert first (same pattern as Lab 5):

```bash
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/CN=127.0.0.1"
```

Then:

```bash
sudo docker-compose up -d
docker compose ps
```

Verify:

```bash
curl -k https://127.0.0.1/
```

`-k` skips certificate validation since it's self-signed — expected and fine.
You should see the home page HTML. Also open `https://127.0.0.1/` in a
browser and click through the "not secure" warning to confirm it renders.

---

## Q3 — Local git server

Already in `docker-compose.yml` as `git-server`, built from
`gitserver.Dockerfile` (bare repo pre-initialized inside).

```bash
git clone http://localhost:3000/repository.git
cd repository
git config --global user.name "Your-Full-Name"
git config --global user.email "your-email@sit.singaporetech.edu.sg"

# copy the whole ssd-exam-project into this cloned repo folder, then:
git add .
git commit -m "Initial commit: compose, webapp skeleton"
git push origin master
```

Make **multiple commits** as you build (Q4.12 explicitly wants to see your
development process) — e.g. one commit for the DB schema, one for the
frontend, one for the backend validation, one for tests.

---

## Q4 — The web app

Already built for you in `webapp/`. Walking through how it satisfies each
sub-requirement:

- **4.1 Home page with login form** → `public/index.html`
- **4.2 Frontend password check** → `public/validate.js`'s `validatePassword()`:
  checks length locally (8–64 chars, no forced composition rules — matching
  OWASP C7 Level 1), then calls the backend for the common-password check
  (the 100k list is too large to ship to the browser, so this part is
  necessarily a backend round-trip)
- **4.3 Backend password check** → `app.js`'s `validatePassword()` — same
  rule, re-checked server-side because client-side checks are bypassable
- **4.4 No MFA** → nothing implemented, by design
- **4.5 Common-password DB** → `webapp/db/init.sql` loads the real
  `100k-most-used-passwords-NCSC.txt` (already downloaded into `db/`) into
  a `common_passwords` table via `COPY`, mounted into Postgres's
  `docker-entrypoint-initdb.d`
- **4.6 Account creation page** → `public/signup.html`
- **4.7 Invalid password → stay on home page** → `app.js`'s `/signup` route
  redirects to `/index.html?error=...` on failure
- **4.8 Valid password → Welcome page with password + logout** →
  redirects to `/welcome.html?user=...&pwd=...`, which displays both and
  has a logout button back to `/index.html`
- **4.9 Log to table `2402725`** → `init.sql` creates it; `/signup` inserts
  `(username, created_at)` only, never the password
- **4.10/4.11** → no CSS, no frameworks, single small functions — this is
  intentional
- **4.12 Commit to Q3's git** → see Q3 above; make it multiple commits

**Rename the table** if your student ID differs from `2402725` — update
both `init.sql` and the `INSERT` in `app.js`.

**Test locally before relying on it:**

```bash
cd webapp
npm install
npm test          # runs both integration.test.js and ui.test.js
```

(`ui.test.js` expects the http listener on 8080 to be running — start the
app first, e.g. via `docker compose up`, or run `node server.js` directly
with `DB_HOST=localhost` if Postgres is exposed locally.)

---

## Q5 — GitHub Actions: integration, dependency check, UI test over http

`.github/workflows/pipeline.yml` has three jobs:

- **`integration-and-ui-tests`** — spins up a throwaway Postgres container,
  loads the same `init.sql` + password list, runs `integration.test.js`,
  then starts the app on **plain http:8080 only** (deliberately not https,
  matching "over http") and runs `ui.test.js` against it
- **`dependency-check`** — OWASP Dependency-Check against `webapp/`,
  same pattern as Lab 6 — remember your `NVD_API_KEY` situation from
  earlier prep (add as a repo secret if you want faster scans, though the
  action here doesn't currently pass it — add `nvdApiKey:` under `with:`
  if you have one)
- **`eslint-security`** — this **is** Q6, folded into the same workflow file

Push this repo to **GitHub** (a real GitHub repo, separate from your local
git server — Q5 says "in your GitHub account"), then also commit the same
`.github/workflows/pipeline.yml` into your **local git server repo** from
Q3, since Q5's last line says to commit the whole repo + workflow files
there too.

```bash
# in your GitHub-connected clone
git add .
git commit -m "Add CI pipeline: integration, dependency-check, ESLint security"
git push origin main   # or your default branch - check what GitHub created

# also push the same commit history to your local git-server remote
git remote add local http://localhost:3000/repository.git
git push local main
```

Check the **Actions** tab on GitHub to confirm all three jobs go green.

---

## Q6 — ESLint security scanning

Already wired into `pipeline.yml`'s `eslint-security` job, using
`webapp/eslint.config.mjs` with `eslint-plugin-security`'s recommended
ruleset (same one-line approach from Lab 8, rather than adding rules
individually).

Confirm the plugin actually works before trusting it — this file
deliberately trips `security/detect-eval-with-expression`:

```bash
cd webapp
echo "eval('1+1');" > /tmp/eslint-check.js
npx eslint /tmp/eslint-check.js
```

You should see a flagged error. Delete the test file afterward.

---

## Q7 — SonarQube in docker-compose

Already in `docker-compose.yml` as `sonarqube` + `sonar-db`.

```bash
docker compose up -d sonarqube sonar-db
docker logs -f sonarqube   # wait for "SonarQube is operational"
```

Go to `http://localhost:9000`, log in `admin`/`admin`, and when forced to
change the password, set it to `2402725@sit.singaporetech.edu.sg` (your
actual student email) as required.

Create the project:
- Project key: `SSD-Exam-2402725` (must match `sonar-project.properties`,
  update both if you use a different key)
- Generate a token, save it

---

## Q8 — Scan the web app locally

```bash
docker run --rm -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli \
  -Dsonar.projectKey=SSD-Exam-2402725 \
  -Dsonar.sources=/usr/src/webapp \
  -Dsonar.exclusions=/usr/src/webapp/node_modules/**,/usr/src/webapp/db/100k-most-used-passwords-NCSC.txt \
  -Dsonar.host.url=http://host.docker.internal:9000 \
  -Dsonar.token=<your_token>
```

(Windows/Mac: use `host.docker.internal`, as established earlier — drop
`--network host` since it's Linux-only.)

Check `http://localhost:9000/dashboard?id=SSD-Exam-2402725` — this is your
scan result.

---

## Q9 — Fix everything and re-scan clean

Read the dashboard's **Bugs**, **Vulnerabilities**, and **Security
Hotspots** tabs. Likely candidates in this codebase to watch for:

- **Hardcoded DB credentials** in `app.js`'s `Pool` config (`apppass`) —
  Sonar will likely flag this as a hotspot/vulnerability. Since env vars
  are already used with fallback defaults, you can remove the fallback
  literals to silence it, or mark the hotspot "Safe" with a justification
  (local exam environment, not production) — both are legitimate,
  documented approaches; pick one and be ready to explain your reasoning.
- **Displaying the password on `welcome.html`** — Sonar's security rules
  may flag rendering sensitive data into the DOM/URL. This is an explicit
  exam requirement (Q4.8), so if flagged, mark it "Safe" in Sonar's
  Security Hotspots review with a note referencing the assignment brief,
  rather than changing the required behavior.
- **`eslint-plugin-security`** findings from Q6 often overlap with what
  Sonar flags (e.g. object injection warnings) — fix the underlying code
  once and both tools should clear.

After each fix:

```bash
git add .
git commit -m "Fix: <what you fixed>"
git push local main
```

Re-run the Q8 scan command. Repeat until the dashboard shows zero open
Bugs/Vulnerabilities and all Hotspots are reviewed (either fixed or marked
Safe with justification — "reviewed and dismissed" still counts as
addressed, unlike leaving them untouched).

---

## Suggested run order on exam day

1. Q1/Q2 — compose + cert + verify HTTPS (fast, mechanical)
2. Q3 — git server up, initial empty commit
3. Q4 — build the app, commit incrementally as you go
4. Q7 — SonarQube up early (it's slow to start — get it booting in the
   background while you work on Q4/Q5/Q6)
5. Q5/Q6 — GitHub Actions once the app is stable
6. Q8/Q9 — scan, fix, re-scan last, since it depends on everything above
   being finished
