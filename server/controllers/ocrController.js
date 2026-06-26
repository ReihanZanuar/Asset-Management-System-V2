const fs = require('fs');
const path = require('path');

/**
 * POST /api/ocr/scan
 * Extract item names from uploaded image using Gemini API
 */
const scanImage = async (req, res) => {
    let tempFilePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        tempFilePath = req.file.path;

        // Check if GEMINI_API_KEY is configured
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Return specific code so client knows to fallback to client-side OCR
            return res.status(400).json({
                error: 'Gemini API key is not configured on the server.',
                code: 'NO_API_KEY'
            });
        }

        // Read image file and convert to base64
        const imageBase64 = fs.readFileSync(tempFilePath).toString('base64');

        // Prepare request to Gemini 1.5 Flash API
        const prompt = 'Analyze this image of a receipt, invoice, delivery note, or list of physical items. ' +
                       'Extract only the names of the items. Return a JSON array of strings containing the item names. ' +
                       'Example format: ["Router Mikrotik", "Switch Cisco 24 Port"]. ' +
                       'Do not return any other text, markdown formatting (such as ```json), or explanations. ' +
                       'If no items are found, return an empty array [].';

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype,
                                data: imageBase64
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!apiResponse.ok) {
            const errorDetails = await apiResponse.text();
            console.error('Gemini API Error details:', errorDetails);
            throw new Error(`Gemini API responded with status ${apiResponse.status}`);
        }

        const responseData = await apiResponse.json();

        let extractedText = '';
        if (
            responseData.candidates &&
            responseData.candidates[0] &&
            responseData.candidates[0].content &&
            responseData.candidates[0].content.parts &&
            responseData.candidates[0].content.parts[0]
        ) {
            extractedText = responseData.candidates[0].content.parts[0].text;
        }

        // Parse extracted JSON string to array
        let items = [];
        try {
            // Trim and clean possible markdown formatting if present
            let cleanedText = extractedText.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
            }
            items = JSON.parse(cleanedText);
        } catch (e) {
            console.error('JSON parsing error of extracted text:', extractedText, e);
            // Fallback: try to split lines or extract string matches
            items = extractedText
                .split('\n')
                .map(line => line.replace(/^[-*+\d.\s]+/g, '').trim())
                .filter(line => line.length > 2 && !line.includes('[') && !line.includes(']'));
        }

        // Ensure output is array of strings
        if (!Array.isArray(items)) {
            items = typeof items === 'string' ? [items] : [];
        }

        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            tempFilePath = null;
        }

        res.json({ success: true, items });

    } catch (error) {
        console.error('OCR / Gemini Scan Error:', error);

        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
            } catch (err) {
                console.error('Failed to delete temp file:', err);
            }
        }

        res.status(500).json({ error: error.message || 'Failed to process image scan' });
    }
};

module.exports = {
    scanImage
};
