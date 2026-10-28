import express from 'express';
import conn from './db.js';
import { ObjectId } from 'mongodb';
import redis from './redis.js';

const router = express.Router();

// health & readiness
router.get('/', async (req, res, next) => {
    try {
        const todos = await conn;
        await todos.db.command({ ping: 1 });

        res.status(200).json({
            health: 'Healthy',
            status: "up",
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            health: 'Unhealthy',
            status: 'down',
            database: 'disconnected',
        });
    }
});

// create todo

/* get all todos */
router.get('/todos', async (req, res, next) => {
    try {
        const cacheKey = 'todos:all';

        // 1. Check Redis cache
        const cachedTodos = await redis.get(cacheKey);

        if (cachedTodos) {
            return res.status(200).json({
                message: 'todos fetched successfully',
                data: JSON.parse(cachedTodos),
                source: 'redis',
            });
        }

        // 2. Cache miss: fetch from MongoDB
        const todos = await conn;
        const result = await todos.find({}).toArray();

        // 3. Store the result in Redis for 60 seconds
        await redis.set(
            cacheKey,
            JSON.stringify(result),
            'EX',
            60
        );

        return res.status(200).json({
            message: 'todos fetched successfully',
            data: result,
            source: 'mongodb',
        });
    } catch (error) {
        console.error('Failed to fetch todos:', error);

        return res.status(500).json({
            error: 'Failed to fetch todos',
            details: error.message,
        });
    }
});


// get all todos
router.get('/todos', async (req, res, next) => {
    try {
        const todos = await conn;
        const result = await todos.find({}).toArray();

        res.status(200).json({
            message: 'todos fetched successfully',
            data: result,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
    }
});

// get a single todo
router.get('/todos/:id', async (req, res, next) => {
    try {
        const todos = await conn;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid Todo ID'
            });
        }

        const todo = await todos.findOne({
            _id: new ObjectId(id),
        });

        if (!todo) {
            return res.status(404).json({
                error: 'Todo Not Found'
            });
        }



        res.status(200).json({
            message: 'Todo fetched successfully',
            data: todo,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Todo', details: error.message });
    }
});

// update a single todo
router.put('/todos/:id', async (req, res, next) => {
    try {
        const todos = await conn;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid Todo ID'
            });
        }

        const result = await todos.updateOne({
            _id: new ObjectId(id),
        },
            {
                $set: req.body
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                error: 'Todo Not Found'
            });
        }

        const udpated_todo = await todos.findOne({
            _id: new ObjectId(id),
        })

        res.status(200).json({
            message: 'Todo udpated successfully',
            data: udpated_todo,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Todo', details: error.message });
    }
});

// delete a single todo
router.delete('/todos/:id', async (req, res, next) => {
    try {
        const todos = await conn;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'Invalid Todo ID'
            });
        }

        const result = await todos.deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: 'Todo Not Found',
            });
        }

        return res.status(204).end();

    } catch (error) {
        res.status(500).json({ error: 'Failed to delete Todo', details: error.message });
    }
});

const routes = router;
export default routes;