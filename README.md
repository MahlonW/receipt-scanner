# Receipt Scanner

A Next.js application that uses AI to extract product information from receipt and invoice images.

## Features

- Upload receipt or invoice images
- AI-powered text extraction using OpenAI's GPT-4o-mini
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
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```
   
   Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

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