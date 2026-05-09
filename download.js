const fs = require('fs');
const https = require('https');

const url = 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQxYzkyYjQ2MzZhZDRjNzVhYzMxNGQyYThiYjAxM2NlEgsSBxDA88OlzwcYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzY5NjUxNTI5Mzg3NzU3NzI3MA&filename=&opi=89354086';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('medication_reminder.html', data);
        console.log('Downloaded medication_reminder.html');
    });
}).on('error', err => {
    console.error('Error: ', err.message);
});
