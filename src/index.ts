import express, { Request, Response } from 'express';
// Import environment variables
import { HOST, PORT } from './config/settings';

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

app.listen(PORT, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});
