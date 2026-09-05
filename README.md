# Author Outreach

A login-based author outreach tracker. Each person who signs up sees only their own contacts, and the same account works from any device (phone, laptop, etc.).

It's built with:
- **React + Vite** for the app itself
- **Supabase** for login and the database (free tier is plenty for this)
- **Vercel** (or Netlify) to host it, also free

You don't need to write any code to get this running — just clicking through the steps below.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up, then click **New project**.
2. Give it a name and password (the password is just for the database itself — save it somewhere safe, but you won't need it day to day).
3. Once the project is ready, open **SQL Editor** in the left sidebar, click **New query**, paste in the contents of `schema.sql` (included in this folder), and click **Run**. This creates the contacts table and makes sure each user can only see their own rows.
4. Go to **Project Settings > API**. You'll need two values from this page in a minute: the **Project URL** and the **anon public** key.
5. Optional but recommended: go to **Authentication > Providers > Email** and turn off "Confirm email" if you don't want to deal with confirmation emails while testing. You can turn it back on later.

## 2. Run it locally (optional, to try it first)

1. Install [Node.js](https://nodejs.org) if you don't have it.
2. In this folder, copy `.env.example` to a new file named `.env`, and fill in the two values from Supabase:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. In a terminal, in this folder, run:
   ```
   npm install
   npm run dev
   ```
4. Open the link it gives you (usually `http://localhost:5173`). Create an account and try it out.

## 3. Put it online (Vercel)

1. Create a free account at [vercel.com](https://vercel.com).
2. Put this project in a GitHub repository (or use Vercel's "Import" and drag-and-drop the folder — either works).
3. In Vercel, click **Add New > Project**, pick this repo/folder. It will auto-detect Vite; leave the build settings as-is.
4. Before deploying, add the two environment variables under **Settings > Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (same values as your `.env` file)
5. Click **Deploy**. In a minute or two you'll get a live URL you can open from your phone, laptop, anywhere — sign in with the same account from any of them.

## Notes

- Each contact is tied to the account that created it — nobody else can see it, including you if you sign in with a different account.
- If you ever want to reset the database, you can re-run parts of `schema.sql`, or just delete rows from the **Table Editor** in Supabase.
- Costs: Supabase's free tier and Vercel's free tier are both enough for personal use like this. If you outgrow them later, both have paid tiers that scale up.
