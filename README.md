# Receipt Scanner

A Next.js application that uses AI to extract product information from receipt and invoice images.

## Features

- Upload receipt or invoice images
- AI-powered text extraction using OpenAI's GPT-5-nano
- Extract product details including name, price, quantity, category, and description
- Display receipt totals, tax, subtotal, store name, and date
- Modern, responsive UI with Tailwind CSS

## Setup

### Option 1: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your configuration:
   ```bash
   # Required: OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   
   # Optional: Password Protection (choose one)
   APP_PASSWORD=your_secure_password_here
   # OR for multiple passwords:
   # APP_PASSWORDS=["admin123", "user456", "guest789"]
   
   # Optional: Application Configuration
   NODE_ENV=development
   PORT=3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI analysis | `sk-...` |
| `OPENAI_MODEL` | AI model to use for receipt analysis | `gpt-4o-mini` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `APP_PASSWORD` | Single password for authentication | None | `mySecurePassword123` |
| `APP_PASSWORDS` | Multiple passwords (JSON array) | None | `["admin", "user", "guest"]` |
| `NODE_ENV` | Application environment | `development` | `production` |
| `PORT` | Server port | `3000` | `8080` |
| `NEXT_PUBLIC_APP_URL` | Public URL for the application | `http://localhost:3000` | `https://yourdomain.com` |

### Password Protection Options

**Option 1: Single Password**
```bash
APP_PASSWORD=mySecurePassword123
```

**Option 2: Multiple Passwords**
```bash
APP_PASSWORDS=["admin123", "user456", "guest789"]
```

**Option 3: No Authentication**
```bash
# Don't set APP_PASSWORD or APP_PASSWORDS
```

### Available AI Models

| Model | Description | Cost | Speed |
|-------|-------------|------|-------|
| `gpt-4o-mini` | Recommended for cost efficiency | Low | Fast |
| `gpt-4o` | Most capable model | High | Medium |
| `gpt-4-turbo` | Balanced performance | Medium | Medium |
| `gpt-3.5-turbo` | Fast and cheap | Very Low | Very Fast |
| `gpt-5-nano` | Latest model (if available) | Low | Fast |

### Environment File Examples

**Development (.env.local):**
```bash
OPENAI_API_KEY=sk-your-dev-key-here
OPENAI_MODEL=gpt-4o-mini
APP_PASSWORD=dev123
NODE_ENV=development
```

**Production (.env):**
```bash
OPENAI_API_KEY=sk-your-prod-key-here
OPENAI_MODEL=gpt-4o-mini
APP_PASSWORDS=["admin2024", "user2024", "backup2024"]
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: Docker Deployment

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd receipt-scanner
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and preferred model
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000)

For detailed Docker deployment instructions, see [DOCKER.md](./DOCKER.md).

## Usage

1. Click "Choose Image" to select a receipt or invoice photo
2. Click "Analyze Receipt" to process the image with AI
3. View the extracted product information and receipt details

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vercel AI SDK** - AI integration
- **OpenAI GPT-5 nano** - Image analysis
- **Lucide React** - Icons

## API Endpoints

- `POST /api/analyze-receipt` - Processes receipt images and returns structured product data

## Project Structure

```
src/
├── app/
│   ├── api/analyze-receipt/
│   │   └── route.ts          # API endpoint for receipt analysis
│   ├── page.tsx              # Main application UI
│   └── layout.tsx            # App layout
├── types/
│   └── product.ts            # TypeScript type definitions
└── ...
```
