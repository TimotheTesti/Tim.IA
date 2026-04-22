# Tim - Setup Guide

## Quick Start

Tim is a modern AI chat application with multimodal capabilities. Follow these steps to get started.

## 1. Prerequisites

- Node.js 18+ installed
- pnpm package manager
- A Supabase project
- Groq API key
- Vercel Blob storage

## 2. Clone/Download the Project

If you're using this from v0, download the project using the provided methods.

## 3. Install Dependencies

```bash
pnpm install
```

## 4. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Groq API Key
GROQ_API_KEY=your-groq-api-key-here

# Vercel Blob Token
BLOB_READ_WRITE_TOKEN=your-blob-token-here
```

### Getting Your Keys

**Supabase:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API to find your URL and anon key
4. Copy them to your `.env.local`

**Groq:**
1. Visit [console.groq.com](https://console.groq.com)
2. Create an API key
3. Copy it to `GROQ_API_KEY`

**Vercel Blob:**
1. Go to [vercel.com/storage/blob](https://vercel.com/storage/blob)
2. Create a token
3. Copy it to `BLOB_READ_WRITE_TOKEN`

## 5. Set Up Supabase Database

Tim uses Supabase PostgreSQL for data persistence. The necessary tables are created automatically through the migration scripts, but you can also manually set them up:

**Tables needed:**
- `conversations` - Stores chat conversations
- `messages` - Stores individual messages
- `users` - Stores user profiles
- `files` - Stores file metadata

Run the migration:
```bash
node scripts/run-migrations.js
```

## 6. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## 7. Access the Application

1. Visit `http://localhost:3000`
2. You'll be redirected to the auth page
3. Sign up with your email
4. Start chatting with Tim!

## Features Overview

### Chat
- Send messages to Tim powered by Groq's Mixtral model
- Get real-time streaming responses
- Messages are saved automatically

### File Uploads
- Click the paperclip icon to upload files
- Supports images, PDFs, and documents
- Files are stored securely in Vercel Blob

### Audio Recording
- Click the microphone icon to record audio
- Send audio messages with your queries
- Recording indicator shows when active

### Theme Toggle
- Click the sun/moon icon to switch themes
- Your preference is saved

### Conversation Management
- All conversations are saved to Supabase
- Access previous conversations from the sidebar
- Create new conversations anytime

### Suggested Prompts
- Find inspiration in the "Suggested" section
- Quick-start prompts for different topics
- Click any prompt to start a conversation

## Troubleshooting

### "Missing environment variables" error
- Make sure `.env.local` file exists in the project root
- Check that all required keys are present
- Restart the dev server after adding env vars

### Authentication fails
- Verify your Supabase URL and anon key are correct
- Check that you're using the public (anon) key, not the service role key
- Make sure your Supabase project is active

### File uploads not working
- Check that `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify Vercel Blob is enabled in your Vercel project
- Check browser console for specific error messages

### Chat not responding
- Verify `GROQ_API_KEY` is correct
- Check that your Groq account has available credits
- Look at network tab in browser DevTools for API errors

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add all environment variables in project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
5. Deploy!

### Deploy Elsewhere

Tim is a standard Next.js 16 app and can be deployed to any platform that supports Node.js:
- AWS Amplify
- Railway
- Render
- Digital Ocean
- Self-hosted servers

Build command: `pnpm build`
Start command: `pnpm start`

## Development Commands

```bash
pnpm dev      # Start dev server with HMR
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Project Structure Quick Reference

```
/app              - Next.js app directory
/components       - React components
/lib              - Utility functions and types
/public           - Static assets
/scripts          - Database migrations
```

## Common Customizations

### Change Tim's System Prompt
Edit `/app/api/chat/route.ts` - look for `TIM_SYSTEM_PROMPT`

### Change Suggested Prompts
Edit `/components/sidebar.tsx` - look for `SUGGESTED_PROMPTS`

### Customize Colors
Edit `/app/globals.css` - modify CSS variables in `:root` and `.dark`

### Change AI Model
Edit `/app/api/chat/route.ts` - change `groq('mixtral-8x7b-32768')` to another model

## Support & Help

- Check the README.md for feature documentation
- Review the code comments for implementation details
- Visit [groq.com](https://groq.com) for API documentation
- Check [supabase.com/docs](https://supabase.com/docs) for database help

## Next Steps

1. Customize Tim's personality in the system prompt
2. Add your branding (logo, colors)
3. Modify suggested prompts for your use case
4. Deploy to production
5. Share with your users!

---

**Happy chatting with Tim!**
