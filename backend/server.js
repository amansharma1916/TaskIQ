import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './database/db_connect.js';
import UsersAuthRoutes from './routes/UsersAuthRoutes.js';
import InviteRoute from './routes/InviteRoute.js';
import TeamsRoute from './routes/TeamsRoute.js';
import MembersRoute from './routes/MembersRoutes.js';
import ProjectsRoute from './routes/ProjectsRoute.js';
import TasksRoute from './routes/TasksRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors(
    {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }
));
connectDB();

app.get('/', (req, res) => {
    res.send('Welcome to TaskIQ API');
});

app.use('/api/auth/users', UsersAuthRoutes);
app.use('/api/auth/ceo', UsersAuthRoutes);
app.use('/api/invite', InviteRoute);
app.use('/api/teams', TeamsRoute);
app.use('/api/members', MembersRoute);
app.use('/api/projects', ProjectsRoute);
app.use('/api/tasks', TasksRoute);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});