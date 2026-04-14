# MapTap GroupMe Bot — Free GitHub Actions Version

This version uses **GitHub Actions only**.

That means:
- no Render
- no hosted server
- no database
- no callback URL
- no monthly hosting bill

Once per day, GitHub Actions will:
1. read messages from your GroupMe chat
2. look only at messages from **March 1, 2026 forward**
3. find valid MapTap posts
4. calculate each user’s all-time average `Final score`
5. post the leaderboard back into the chat

---

## What the bot posts

Example output:

```text
MapTap All-Time Average

1. User 1: 842.3
2. User 2: 817.0
3. User 3: 799.4

Updated: Apr 14, 2026, 12:00 PM

I seriously hope nobody does the stats on our performances
```

---

## What counts as a valid MapTap message

A message must look like this:

```text
April 14
94🏅 93🏆 90👑 93🏆 60😐
Final score: 826
```

The script extracts:
- the date line
- the five round scores
- the final score

It uses the **Final score** for the leaderboard.

---

# Part 1 — What you need before you start

You need 4 things:

1. a GitHub account
2. a GroupMe account
3. the target GroupMe chat already created
4. a GroupMe bot created inside that chat

---

# Part 2 — Get the 3 GroupMe values you need

You need these exact values:

- `GROUPME_ACCESS_TOKEN`
- `GROUPME_GROUP_ID`
- `GROUPME_BOT_ID`

## Step 2.1 — Get your GroupMe access token

1. Go to the GroupMe developer site.
2. Sign in.
3. Create or view your access token.
4. Copy it somewhere safe.

You will later save it in GitHub Secrets as:

```text
GROUPME_ACCESS_TOKEN
```

---

## Step 2.2 — Find your Group ID

### Easiest method

1. Open GroupMe in your browser.
2. Open the chat you want the bot to use.
3. Look at the URL.
4. The number in the URL for that group is often the group ID.

If you are not sure, use the GroupMe API to list your groups.

Save that value as:

```text
GROUPME_GROUP_ID
```

---

## Step 2.3 — Create the bot and copy the bot ID

1. In the GroupMe developer portal, create a bot.
2. Choose the correct group.
3. Give the bot a name.
4. Give it an avatar if you want.
5. You do **not** need a callback URL for this version.
6. Save the bot.
7. Copy the bot ID.

Save that value as:

```text
GROUPME_BOT_ID
```

---

# Part 3 — Put this project in GitHub

## Step 3.1 — Create a GitHub repository

1. Go to GitHub.
2. Click **New repository**.
3. Name it something like:

```text
maptap-tracker
```

4. Choose **Private** if you want.
5. Create the repo.

---

## Step 3.2 — Upload these files

### Option A — easiest if you are using local files

If you downloaded this starter project and unzipped it locally:

1. Open Terminal.
2. Go into the project folder.
3. Run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

If you already connected a remote before, do not run `git remote add origin` again.

If Git says the remote already has files, pull first:

```bash
git pull origin main --no-rebase --allow-unrelated-histories
```

Then fix any merge conflicts, commit, and push again.

---

# Part 4 — Add your secrets in GitHub

This is the most important part.

## Step 4.1 — Open repository secrets

In your GitHub repo:

1. Click **Settings**
2. Click **Secrets and variables**
3. Click **Actions**
4. Click **New repository secret**

Create these 4 secrets:

### Secret 1
Name:

```text
GROUPME_ACCESS_TOKEN
```

Value:
Your GroupMe access token

### Secret 2
Name:

```text
GROUPME_GROUP_ID
```

Value:
Your GroupMe group ID

### Secret 3
Name:

```text
GROUPME_BOT_ID
```

Value:
Your GroupMe bot ID

### Secret 4
Name:

```text
MAPTAP_START_DATE
```

Value:

```text
2026-03-01
```

---

# Part 5 — Run it manually once to test

## Step 5.1 — Open GitHub Actions

1. Open your repository
2. Click **Actions**
3. Click **Daily MapTap leaderboard**
4. Click **Run workflow**
5. Click the green run button

This will run the script immediately.

---

## Step 5.2 — Confirm the bot posted in GroupMe

Go to the GroupMe chat and check for the leaderboard message.

If you do not see a message:
- open the GitHub Actions run
- click the job
- expand the failed step
- read the error message

---

# Part 6 — Automatic daily posting

This project already includes the workflow file.

File:

```text
.github/workflows/daily-post.yml
```

GitHub Actions will run it automatically every day.

Important note:
- GitHub cron uses **UTC**
- this workflow runs at both **16:00 UTC** and **17:00 UTC** to cover daylight saving time changes

The script includes a safety check and only posts when the local time in New York is actually 12 PM, so the extra cron entry is just there to safely cover daylight saving time.

---

# Part 7 — Test locally before pushing (optional)

If you want to test on your own computer:

## Step 7.1 — Install Node.js

Install Node.js 20 or newer.

## Step 7.2 — Create your local env file

Copy `.env.example` to `.env`.

Then fill in the values.

## Step 7.3 — Run the parser test

```bash
npm install
npm run test:sample
```

You should see parsed output for the sample message.

## Step 7.4 — Dry run the full script

In Terminal:

```bash
export $(cat .env | xargs)
node src/index.js
```

Because `.env.example` sets `DRY_RUN=true`, it will show the message preview without posting.

When you are ready to post for real, change:

```text
DRY_RUN=false
```

---

# Part 8 — How the files are organized

## Main code

- `src/index.js` — main script
- `src/parser.js` — reads MapTap messages
- `src/groupme.js` — talks to the GroupMe API
- `src/config.js` — loads settings
- `src/format.js` — formats the leaderboard post
- `src/date-utils.js` — date helpers

## GitHub Actions

- `.github/workflows/daily-post.yml` — daily scheduler

## Testing

- `scripts/test-sample.js` — sample parser test

---

# Part 9 — What this bot does not do

This version is intentionally simple.

It does **not**:
- react instantly to new messages
- store a database
- use a callback URL
- keep an external cache

Instead, every day it re-reads the group history from March 1, 2026 onward and recomputes the averages fresh.

That is why this version stays free and simple.

---

# Part 10 — Troubleshooting

## Problem: Git says push rejected

Run:

```bash
git pull origin main --no-rebase --allow-unrelated-histories
```

Then resolve any conflicts, commit, and push again.

---

## Problem: GitHub Action fails because a secret is missing

Check that all 4 secrets exist exactly with these names:

- `GROUPME_ACCESS_TOKEN`
- `GROUPME_GROUP_ID`
- `GROUPME_BOT_ID`
- `MAPTAP_START_DATE`

---

## Problem: Bot does not post anything

Possible causes:
- the bot ID is wrong
- the group ID is wrong
- the access token is wrong
- there are no valid MapTap messages since `2026-03-01`
- the bot was created in a different GroupMe chat

---

## Problem: Messages are not being picked up

The parser expects:
- a date line
- one line with 5 numeric round scores
- a line that starts with `Final score:`

If your group uses a slightly different format, the parser can be adjusted easily.

---

# Part 11 — Official references

GroupMe’s official API docs say group messages can be retrieved from `GET /groups/:group_id/messages`, paged backward with `before_id`, and bots can post into a group with `POST /bots/post`. citeturn981729search0

GitHub’s official docs say scheduled workflows are supported in GitHub Actions, and private repositories on GitHub Free get included Actions minutes each month. citeturn981729search1turn981729search3

---

# Part 12 — Fastest path

If you just want the shortest version:

1. create the GroupMe bot
2. copy the token, group ID, and bot ID
3. upload this project to GitHub
4. add the 4 GitHub secrets
5. run the workflow manually once
6. confirm the post appears in GroupMe
7. let GitHub Actions handle the daily noon post
