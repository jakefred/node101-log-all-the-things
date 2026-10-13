const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');

app.use((req, res, next) => {
    res.on('finish', () => {
        const time = new Date().toISOString();
        const method = req.method;
        let agent = req.get('User-Agent') || '';
        agent = agent.replaceAll(",", " ");
        const resource = req.path;
        const httpVersion = "HTTP/" + req.httpVersion;
        const status = res.statusCode;
        const row = `${agent},${time},${method},${resource},${httpVersion},${status}`;

        console.log(row);

        fs.appendFile(
            path.join(__dirname, '../log.csv'),
            row + '\n',
            (err) => {
                if (err) {
                    console.error('Could not write log:', err);
                }
            }
        );
    });

    next();
});

app.get('/', (req, res) => {
    res.status(200).send("ok");
});

app.get('/logs', (req, res) => {
    fs.readFile(path.join(__dirname, '../log.csv'), 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Could not read logs' });
        }

        // splits into lines (windows \r\n or Unix \n)
        const lines = data.trim().split(/\r?\n/);
        // takes first line and assigns it split at the comma to headers array
        const headers = lines.shift().split(',');

        const logs = lines
            .filter(line => line.trim() !== '') // filters out empty lines (including whitespace)
            .map(line => {
                const values = line.split(','); // splits line into array of values
                const entry = {};

                // assigns key-value pairs with header as key and value at position of header as value
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });

                return entry;
            });

        res.json(logs);
    });
});

module.exports = app;
