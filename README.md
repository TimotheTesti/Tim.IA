# Tim - Modern AI Chat Application

A premium SaaS-style AI chat application featuring multimodal capabilities, built with Next.js, TypeScript, and powered by Groq AI.

## Features

### Core Chat
- **Streaming Chat Interface**: Real-time responses from Tim (powered by Groq's Mixtral model)
- **Conversation History**: Save and load conversations from Supabase
- **Modern UI**: Gemini 3-inspired design with smooth animations

### Multimodal Capabilities
- **File Uploads**: Upload documents and images to Vercel Blob storage
- **Image Support**: Share images with Tim for analysis
- **Audio Recording**: Record voice messages to send with your queries
- **Document Analysis**: Send PDFs and documents for Tim to analyze

### User Experience
- **Authentication**: Secure Supabase Auth with email/password
- **Theme Switching**: Light/dark mode toggle
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Conversation Management**: Create, view, and organize conversations
- **Suggested Prompts**: Quick-start suggestions for inspiration

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn UI components
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **File Storage**: Vercel Blob
- **AI/LLM**: Groq API (Mixtral-8x7b-32768)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **HTTP Client**: AI SDK 6

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase project
- Groq API key
- Vercel Blob storage

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Installation

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── api/
│   ├── chat/          # Main chat streaming endpoint
│   ├── upload/        # File upload to Blob storage
│   ├── image-gen/     # Image generation/analysis
│   └── transcribe/    # Audio transcription
├── auth/              # Authentication page
├── chat/              # Main chat interface
└── page.tsx           # Home page redirect

components/
├── chat-area.tsx      # Chat UI with input
├── message-bubble.tsx # Message display
├── sidebar.tsx        # Conversation sidebar
├── tim-avatar.tsx     # Tim character avatar
└── settings-dialog.tsx# Settings menu

lib/
├── store.ts          # Zustand state management
└── supabase.ts       # Supabase client & types
```

## Features in Detail

### Chat Interface
- Real-time streaming responses from Tim
- Support for multimodal input (text, images, files)
- Message editing and regeneration
- Conversation context management

### Authentication
- Sign up and sign in with email
- Session persistence
- Secure token management

### File Management
- Upload files directly in chat
- Files stored in Vercel Blob
- Support for images, PDFs, and documents

### Suggested Prompts
- Pre-written conversation starters
- Categorized by topic
- Easy access from sidebar

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Make sure to set all environment variables in Vercel project settings.

## Development

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Database Schema

The app uses Supabase with the following main tables:
- `conversations` - Chat conversations
- `messages` - Chat messages with multimodal support
- `users` - User profiles and settings
- `files` - File metadata and storage references

## Future Enhancements

- Cross-platform apps (Tauri for desktop, Expo for mobile)
- Advanced image generation capabilities
- Real audio transcription via external services
- Public conversation sharing
- Team collaboration features
- Custom AI model fine-tuning
- Plugin system for extending Tim's capabilities

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.

---

**Built with Tim** - Your modern AI assistant
