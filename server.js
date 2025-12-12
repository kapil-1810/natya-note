require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves the frontend

// Mock data for demo mode
const mockSuggestions = {
    'Tihai': [
        'Dha Dhin Dhin Dha | Dha Jha Nu | Dha Dhin Dhin Dha | Dha Jha Nu | Dha Dhin Dhin Dha Dha',
        'Ta Ki Ta | Dha Dhin Dhin | Ta Ki Ta | Dha Dhin Dhin | Ta Ki Ta Dha',
        'Dha Dhin Dhun | Na Kat Dha | Dha Dhin Dhun | Na Kat Dha | Dha Dhin Dhun Dha',
    ],
    'Toda': [
        'Dha Dhin Dhin Dha Ta Ki Ta | Dha Jha Nu Dha | Dha Dhin Dhin Dha Ta Ki Ta Ta',
        'Ta Dhin Dhin Ta | Ta Dhin Dhin Ta | Ta Dhin Dhin Ta | Dhum Tah',
        'Dha Ki Ta | Jha Nu Dha | Dha Ki Ta | Jha Nu Dha | Dha Ki Ta Dha Dhum',
    ],
    'Chakkar': [
        'Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dhum',
        'Ta Ki Ta Jha | Nu Dha | Ta Ki Ta Jha | Nu Dha | Ta Ki Ta',
        'Dha Dhin | Ta Jha Nu | Dha Dhin | Ta Jha Nu | Dha Dhin Dha',
    ],
    'Aamad': [
        'Dha Dhin Dhin Dha | Ta Ki Ta | Dha Jha Nu Dha',
        'Ta Dhin Dhin Ta | Na Kat Dha | Ta Dhin Dhin Ta',
        'Dha Dhin Dha | Dha Dhin Dha | Dha Dhin Dha | Dhum Tah',
    ]
};

// List of models to try (in order of preference)
const MODELS_TO_TRY = [
    'qwen-2.5-72b',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant',
];

// The AI Route with fallback and demo mode
app.post('/generate-step', async (req, res) => {
    const { taal, type, context } = req.body;

    console.log(`She asked for: ${type} in ${taal}`);

    // System prompt for AI
    const systemPrompt = `You are an expert Kathak Choreographer.
    Generate a creative, rhythmic '${type}' sequence for '${taal}'.
    
    Rules:
    1. Output ONLY the Bols (syllables). No explanations.
    2. Use standard syllables like: Dha, Dhin, Ta, Na, TiTa, KiTa, Tak, Dhum.
    3. Make sure it fits the rhythm structure of ${taal}.
    4. If she provided context: "${context}", try to match that flow.`;

    // Try each model
    for (const model of MODELS_TO_TRY) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate a ${type}` }
                ],
                model: model,
                temperature: 0.7,
            });

            const danceStep = completion.choices[0].message.content;
            console.log(`✓ Success with model: ${model}`);
            return res.json({ result: danceStep });

        } catch (error) {
            console.log(`✗ Model ${model} failed: ${error.message}`);
            // Continue to next model
        }
    }

    // If all models fail, use demo mode with mock data
    console.log('All models failed, using demo mode with mock suggestions');
    const suggestions = mockSuggestions[type] || mockSuggestions['Tihai'];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    return res.json({ 
        result: randomSuggestion,
        demo: true,
        message: '(Using demo mode - connect to internet or update API for live AI suggestions)'
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Natya-Note is ready at http://localhost:${PORT}`);
});