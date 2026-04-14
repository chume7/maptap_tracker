# MapTap GroupMe Bot

This project does four things:

1. receives new messages from one specific GroupMe chat
2. detects MapTap score posts
3. stores every valid score by user
4. posts a daily all-time average leaderboard at noon

It is designed to be as beginner-friendly as possible.

---

## What this bot expects

The bot looks for messages in this format:

```text
April 14
94🏅 93🏆 90👑 93🏆 60😐
Final score: 826
```

The bot extracts:

- the date text (`April 14`)
- the five round scores (`94`, `93`, `90`, `93`, `60`)
- the final score (`826`)
- the sender from GroupMe

Then it stores the result and uses the `Final score` to compute each user's all-time average.

---

## What you need before you start

You need these accounts or tools:

- a **GroupMe account**
- access to the **specific GroupMe group chat**
- a **GitHub account**
- a **Render account**
- **Node.js 20 or newer** installed on your computer
- **Git** installed on your computer

If you do not already have Node.js:

1. go to the official Node.js website
2. install the **LTS** version
3. after install, open Terminal and run:

```bash
node -v
npm -v
```

You should see version numbers.

---

## How the system works

There are 3 moving parts:

### Part 1: the web app

This app runs on Render and exposes a public URL.

It has these routes:

- `POST /groupme/callback` → receives new GroupMe messages
- `GET /health` → lets you confirm the app is alive
- `POST /jobs/daily-post` → posts the daily leaderboard
- `POST /jobs/backfill` → optional protected route to backfill old messages

### Part 2: the database

The app stores valid MapTap submissions in SQLite.

### Part 3: the daily scheduler

A GitHub Actions workflow triggers the app once per day at noon Eastern Time and tells it to post the leaderboard.

That means:

- Render keeps the app online for GroupMe callbacks
- GitHub Actions handles the schedule

This combination is simple and avoids extra cron setup on your server. GitHub Actions supports scheduled workflows with cron syntax, and scheduled times are based on UTC unless you explicitly handle timezone conversion. citeturn352556search2turn352556search8

---

## Fastest setup path

Follow these steps in order.

1. create the GroupMe bot
2. download this project and put it in GitHub
3. deploy it to Render
4. add your secrets in Render
5. set your GroupMe bot callback URL
6. run the backfill once
7. add GitHub Actions secrets
8. let the daily post run automatically

---

## Step 1: create your GroupMe access token

GroupMe uses OAuth to create an access token for your app account. citeturn352556search3

You need:

- your **GroupMe access token**
- your **GroupMe group ID**
- your **GroupMe bot ID**

### 1A. Get your GroupMe access token

Use the GroupMe developer site.

Once you have the token, copy it somewhere safe. You will paste it into Render and GitHub later.

Save it as:

```text
GROUPME_ACCESS_TOKEN
```

---

## Step 2: find your GroupMe group ID

You need the ID of the exact group chat that contains the MapTap messages.

A simple way to get it:

1. use the GroupMe developer tools or API explorer
2. list your groups
3. find the correct group name
4. copy its `group_id`

Save it as:

```text
GROUPME_GROUP_ID
```

---

## Step 3: create the bot in that GroupMe group

GroupMe bots can be created in a specific group and can be given a `callback_url`. GroupMe will send an HTTP `POST` to that callback URL every time a new message is posted in the group. Bots also post back to the group using their `bot_id`. citeturn352556search0turn352556search6

When you create the bot, save the returned:

```text
GROUPME_BOT_ID
```

You can leave the callback URL blank at first if you have not deployed the app yet.

Later, after deployment, you will set:

```text
https://YOUR-APP-URL/groupme/callback
```

---

## Step 4: put this project on your computer

### 4A. Unzip the project

Unzip the folder somewhere easy to find.

Example:

```text
Desktop/maptap-groupme-bot
```

### 4B. Open Terminal in the project folder

Example:

```bash
cd ~/Desktop/maptap-groupme-bot
```

### 4C. Install dependencies

```bash
npm install
```

---

## Step 5: test the parser locally

This is optional but recommended.

Run:

```bash
npm run test-parser
```

You should see the sample message parsed successfully.

---

## Step 6: create your local env file

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` and fill in:

- `GROUPME_ACCESS_TOKEN`
- `GROUPME_BOT_ID`
- `GROUPME_GROUP_ID`
- `APP_BASE_URL` (leave blank for now if local)
- `DAILY_JOB_SECRET` (pick a long random string)

For local testing, this is fine:

```text
PORT=3000
DATABASE_PATH=./data/maptap.sqlite
TIMEZONE=America/New_York
DAILY_POST_HOUR_LOCAL=12
```

---

## Step 7: run the app locally

Start the server:

```bash
npm start
```

You should see output similar to:

```text
MapTap bot listening on port 3000
```

Then visit:

```text
http://localhost:3000/health
```

You should see JSON showing the app is healthy.

---

## Step 8: push this project to GitHub

If you are new to GitHub, do exactly this.

### 8A. Create a new GitHub repository

Give it a name like:

```text
maptap-groupme-bot
```

### 8B. In Terminal, from your project folder, run:

```bash
git init
git add .
git commit -m "Initial MapTap GroupMe bot"
```

### 8C. Connect it to GitHub

Replace `YOUR_GITHUB_REPO_URL` with the URL GitHub gives you:

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

---

## Step 9: deploy to Render

Render supports a `render.yaml` Blueprint file that defines your app in your repository. citeturn352556search1turn352556search4turn352556search19

This project already includes `render.yaml`, so deployment is easier.

### 9A. In Render

1. log in
2. choose **New**
3. choose **Blueprint**
4. connect your GitHub repository
5. select this repository
6. let Render read `render.yaml`

### 9B. Fill in the required secrets in Render

Render will ask for these env vars:

- `APP_BASE_URL`
- `GROUPME_ACCESS_TOKEN`
- `GROUPME_BOT_ID`
- `GROUPME_GROUP_ID`
- `DAILY_JOB_SECRET`

Set `APP_BASE_URL` to your final public app URL.

Example:

```text
https://maptap-groupme-bot.onrender.com
```

### 9C. Finish deployment

When deployment finishes, open:

```text
https://YOUR-APP-URL/health
```

You should see a healthy response.

---

## Step 10: set the GroupMe callback URL

Now that your app is live, update the bot's callback URL to:

```text
https://YOUR-APP-URL/groupme/callback
```

GroupMe bots with a callback URL will POST every new group message to that URL. citeturn352556search0turn352556search6

At this point, all **new** MapTap messages in that group will be stored automatically.

---

## Step 11: import old messages with backfill

This is how you load all historical MapTap posts.

You have two ways to do it.

### Option A: easiest way — run from your own computer

From your project folder, run:

```bash
npm run backfill
```

This script calls the GroupMe messages API, pages backward through the group history, parses every valid MapTap message, and stores the results in your database.

GroupMe's messages endpoint supports reading group messages and paging older messages using `before_id`. citeturn352556search6

### Option B: run on the server

You can also call the protected backfill route.

Example using curl:

```bash
curl -X POST https://YOUR-APP-URL/jobs/backfill \
  -H "x-job-secret: YOUR_DAILY_JOB_SECRET"
```

I recommend **Option A** first because it is easier to watch and debug.

---

## Step 12: test a manual leaderboard post

Before automating the daily post, test it once.

Run this from Terminal:

```bash
curl -X POST https://YOUR-APP-URL/jobs/daily-post \
  -H "x-job-secret: YOUR_DAILY_JOB_SECRET"
```

The bot should post the leaderboard into the GroupMe chat.

If it does, the core system is working.

---

## Step 13: automate the daily noon post with GitHub Actions

This repo already includes:

```text
.github/workflows/daily-post.yml
```

GitHub Actions supports scheduled workflows using cron syntax. Scheduled runs are based on UTC, so this workflow is set up to run at **both 16:00 UTC and 17:00 UTC every day**. The app itself checks New York local time and only posts when the local hour is exactly noon, which keeps the noon post working across daylight saving changes without any manual edits. citeturn352556search2turn352556search8

### 13A. Add GitHub Actions secrets

In your GitHub repo:

1. go to **Settings**
2. go to **Secrets and variables**
3. go to **Actions**
4. add these secrets:

- `APP_BASE_URL`
- `DAILY_JOB_SECRET`

Example values:

- `APP_BASE_URL` = `https://maptap-groupme-bot.onrender.com`
- `DAILY_JOB_SECRET` = your long secret string

### 13B. Confirm the workflow exists

The file is already included. Once pushed to `main`, GitHub will show it under **Actions**.

### 13C. Optional: run it manually once

The workflow supports manual runs from GitHub Actions.

---

## Important time note

You do **not** need to manually change the schedule for daylight saving time.

The included GitHub workflow runs twice daily, once at `16:00 UTC` and once at `17:00 UTC`. The server checks the configured timezone (`America/New_York`) and only posts when the local hour is `12`.

That means:

- one run will be ignored
- the noon-local run will post
- only one post can happen per day because the app records that it already posted

---

## Common commands

### Start locally

```bash
npm start
```

### Run backfill

```bash
npm run backfill
```

### Test parser

```bash
npm run test-parser
```

---

## Troubleshooting

### The bot is not posting

Check:

- `GROUPME_BOT_ID` is correct
- the bot belongs to the correct group
- the app is live at `/health`
- the daily job secret matches in both Render and GitHub

### New messages are not being saved

Check:

- callback URL is exactly `https://YOUR-APP-URL/groupme/callback`
- the message really matches the expected format
- the group ID in env matches the actual group

### Backfill says it is working but nothing is stored

Check:

- your GroupMe access token is correct
- the group ID is correct
- the target group really contains MapTap messages in the expected text format

### Duplicate counting

This app prevents duplicate inserts by GroupMe message ID.

---

## Behavior choices already built in

This starter project does the following by default:

- counts **all valid submissions** for each user
- computes averages using `Final score`
- tracks users by stable GroupMe `user_id`
- displays the latest known display name
- ignores bot messages
- ignores invalid message formats
- prevents duplicate inserts by message ID
- only posts once per local day, even if the daily endpoint is hit more than once

---

## Files included

```text
src/index.js              main server
src/config.js             environment loading and validation
src/db.js                 SQLite database setup and queries
src/parser.js             MapTap message parser
src/groupme.js            GroupMe API helpers
scripts/backfill.js       historical import script
scripts/test-parser.js    parser smoke test
.github/workflows/daily-post.yml
render.yaml
.env.example
```

---

## Next improvements you might want later

Once this is working, common upgrades are:

- add a second leaderboard for average by round 1–5
- add a minimum-games threshold before showing a user
- add `best score ever` per user
- post a weekly instead of daily summary too
- add an endpoint that shows raw submission history per user

---

## Final setup checklist

Before you consider setup complete, confirm all of these:

- [ ] Render app is deployed
- [ ] `/health` works
- [ ] GroupMe callback URL is set
- [ ] one new MapTap message gets stored
- [ ] backfill completes
- [ ] manual daily post works
- [ ] GitHub Actions secrets are set
- [ ] scheduled noon post works

If you work through the checklist in order, you will have a live bot with historical stats and automatic daily leaderboard posts.
