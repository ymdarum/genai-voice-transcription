require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const app = express();

// Verify API key is loaded
if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
}

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files
app.use(express.static('public'));
app.use('/transcriptions', express.static('transcriptions'));

// Handle transcription requests
app.post('/transcription', (req, res) => {
    const transcription = req.body.transcription;
    console.log('Received Transcription:', transcription);
    
    const filename = `transcription_${Date.now()}.txt`;
    const filepath = path.join(__dirname, 'transcriptions', filename);
    
    if (!fs.existsSync(path.join(__dirname, 'transcriptions'))) {
        fs.mkdirSync(path.join(__dirname, 'transcriptions'));
    }
    
    fs.writeFileSync(filepath, transcription);
    
    res.json({ 
        message: 'Transcription received successfully!',
        filename: filename
    });
});

// Handle OpenAI chat requests
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are Gapicriber, a helpful assistant that processes voice transcriptions and provides thoughtful responses."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            temperature: 0.7,
        });

        res.json({ response: completion.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
