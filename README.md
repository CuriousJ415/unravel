# 🧵 Unravel

**Personal AI Pattern Processor**

A web application for processing text, files, and URLs using AI with customizable patterns. Supports multiple AI providers and includes 35 patterns for common tasks.

*Inspired by Daniel Miessler's [Fabric](https://github.com/danielmiessler/fabric) project.*

## Features

- **Web interface** - Simple browser-based interface for AI pattern processing
- **Multiple AI providers** - Support for OpenAI, Anthropic, OpenRouter, Grok, and local Ollama
- **35 patterns included** - Pre-built patterns covering writing, analysis, business, and creative tasks
- **Pattern editor** - View and edit patterns with preview/edit tabs
- **File processing** - Upload and process documents (PDF, DOCX, TXT, etc.)
- **URL processing** - Extract and process web content
- **YouTube processing** - Extract transcripts and metadata from YouTube videos
- **Multiple themes** - 5 themes including Dark, Light, High Contrast, Warm, and Fabric
- **Automated testing** - Built-in test suite for functionality verification

## Quick Start

### Docker Installation (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/[username]/unravel.git
   cd unravel
   ```

2. **Configure API keys** through the web interface settings panel, or set environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Build and run**:
   ```bash
   docker build -t unravel .
   docker run -d --name unravel -p 3007:3006 unravel
   ```

4. **Access the application**: http://localhost:3007

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

## Usage

1. **Configure API keys** - Go to Settings (⚙️) and add your AI provider API keys
2. **Select a pattern** - Choose from 35 available patterns organized by category
3. **Choose AI provider** - Pick from configured providers (Ollama, OpenAI, Anthropic, etc.)
4. **Add your input** - Text, file upload, URL, or YouTube video
5. **Process** - Click Process to get AI-generated results
6. **Export results** - Copy to clipboard or download as text file

## Pattern Library

Unravel includes 35 patterns organized into categories:

### Content Analysis (5 patterns)
- **extract_wisdom** - Extract insights and wisdom from content
- **summarize** - Create concise summaries of long content
- **explain_concepts** - Explain complex topics in simple terms
- **analyze_claims** - Fact-check and verify claims
- **extract_insights** - Pull key insights from any content

### Writing & Communication (7 patterns)
- **improve_writing** - Polish and enhance any text
- **write_email** - Professional email drafting
- **create_presentation** - Outline presentations from topics
- **write_essay** - Academic and professional writing assistance
- **rewrite_prose** - Rewrite text for different audiences
- **create_social_media_post** - Social media content creation
- **write_creative_story** - Creative writing and storytelling

### Business & Professional (8 patterns)
- **analyze_contract** - Contract analysis and review
- **create_meeting_summary** - Meeting notes and action items
- **write_job_description** - HR and hiring assistance
- **analyze_business_case** - Evaluate proposals and opportunities
- **create_marketing_copy** - Sales and marketing content
- **plan_project** - Project planning and management
- **analyze_competitor** - Competitive analysis and research
- **create_interview_questions** - Interview preparation

### Learning & Research (3 patterns)
- **create_study_guide** - Study materials from content
- **analyze_paper** - Academic paper analysis
- **research_topic** - Research assistance and methodology

### Technical (4 patterns)
- **explain_code** - Code explanation for any language
- **create_documentation** - Technical documentation writing
- **troubleshoot_issue** - Problem-solving assistance
- **debug_problem** - Systematic debugging approach

### Creative & Media (3 patterns)
- **create_lesson_plan** - Educational content planning
- **create_video_script** - Video content scripting
- **generate_ideas** - Brainstorming and idea generation

### Health & Personal (2 patterns)
- **create_workout_plan** - Fitness planning and routines
- **analyze_symptoms** - Health symptom analysis (informational only)

### Legal & International (3 patterns)
- **translate_and_localize** - Translation with cultural adaptation
- **analyze_financial_data** - Financial analysis and insights
- **analyze_legal_document** - Legal document review (informational only)

## AI Provider Configuration

### Supported Providers
- **Ollama** (Local) - No API key required, configure base URL
- **OpenAI** - Requires API key (sk-...)
- **Anthropic** - Requires API key (sk-ant-...)
- **OpenRouter** - Requires API key (sk-or-...)
- **Grok** - Requires API key (xai-...)

### API Key Setup
1. Click Settings (⚙️) in the application
2. Add your API keys for desired providers
3. Keys are stored locally in your browser
4. Available providers will appear in the dropdown automatically

## Pattern Management

### Using Patterns
- Select any pattern from the dropdown menu
- Click the Edit tab to view and modify pattern content
- Save custom variations as new patterns
- Reset to original content anytime

### Adding Custom Patterns
Create new patterns in the `patterns/` directory:
```
patterns/
  my_pattern/
    system.md    # Main pattern prompt (required)
    user.md      # Optional user context
```

## Testing

Run the included test suite to verify functionality:

```bash
# Run full test suite
npm test

# Quick health check
npm run test:quick

# Continuous monitoring
npm run monitor
```

## Configuration Options

### Environment Variables
- `PORT` - Server port (default: 3006)
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `GROK_API_KEY` - Grok API key
- `YOUTUBE_API_KEY` - YouTube Data API key (optional)

### Themes
Choose from 5 available themes:
- **Dark** - Default dark theme
- **Light** - Clean light interface
- **High Contrast** - Maximum accessibility
- **Warm** - Comfortable amber tones
- **Fabric** - Inspired by the original Fabric project

## Limitations

- File upload limited to 50MB
- Supported file types: PDF, DOCX, TXT, MD, CSV, JSON
- YouTube processing requires yt-dlp (included in Docker)
- AI provider API keys required for online processing
- Health and legal pattern outputs are informational only

## Troubleshooting

### Common Issues
- **Patterns not loading**: Restart the Docker container
- **API errors**: Check API keys in Settings
- **YouTube processing fails**: Ensure yt-dlp is installed
- **File upload fails**: Check file size and type

### Getting Help
1. Run the test suite: `npm run test:quick`
2. Check Docker logs: `docker logs unravel`
3. Review the troubleshooting guide in the test output
4. Open an issue on GitHub with diagnostic information

## Security

- Input sanitization and validation
- File type restrictions
- Rate limiting protection
- API keys stored locally in browser only
- No user data stored on server

## Contributing

This project welcomes feedback and suggestions:

1. Test the application with various patterns and providers
2. Report issues with diagnostic information from test suite
3. Suggest additional patterns for common use cases
4. Contribute pattern improvements or new patterns

## License

MIT License - Feel free to use and modify for personal or commercial purposes.

## Acknowledgments

- **Daniel Miessler** - Original Fabric concept and pattern inspiration
- **Fabric community** - Pattern ideas and feedback
- **Open source contributors** - Dependencies and tools

---

**A practical tool for AI-assisted productivity**

*Built for personal use, shared for community benefit*