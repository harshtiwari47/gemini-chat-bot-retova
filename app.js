const express = require('express');
const path = require('path');
const {
   GoogleGenerativeAI
} = require("@google/generative-ai");
const {
   marked
} = require('marked');

const app = express();

require('dotenv').config();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/response', async (req, res) => {
   try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Add your API key or other required parameters
      const model = genAI.getGenerativeModel({
         model: "gemini-1.5-flash"
      });

      const {
         prompt,
         history
      } = req.body;

      if (!prompt) {
         return res.status(400).json({
            error: 'Prompt is required'
         });
      }

      const chat = model.startChat(history);
      let result = await chat.sendMessage(prompt);

      const response = await result.response;
      console.log(response)
      if (response && response.text) {
         const text = marked(response.text());
         return res.status(200).json({
            normalResponse: response.text(),
            output: text,
            usageMetadata: response.usageMetadata,
         });
      } else {
         return res.status(500).json({
            error: 'An unexpected error occurred.'
         });
      }
   } catch (error) {
      console.error(error);
      return res.status(400).json({
         error: `An error occurred while processing your request.`
      });
   }
});

app.listen(3000, () => {
   console.log('App is listening on port 3000');
});