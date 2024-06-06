const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let votes = {
    "option1": 0,
    "option2": 0
};

app.post('/vote', (req, res) => {
    try {
        const { option } = req.body;

        if (!option || !votes.hasOwnProperty(option)) {
            throw new Error('Invalid vote option.');
        }

        votes[option] += 1;
        res.send(`Vote for ${option} counted.`);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});

app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!");
});

app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Voting app listening at http://localhost:${port}`);
});