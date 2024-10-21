import { PrismaClient } from "@prisma/client";
import express, {Express, Request, Response} from "express";
import cookieParser from 'cookie-parser'
import { z } from "zod";
import { authMiddleware } from "./middleware"
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
const userSignupSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(3, 'Name should have at least 3 characters').optional(),
    lastName: z.string().min(3, 'Name should have at least 3 characters').optional(),
    password: z.string().min(6, 'Password should be at least 6 characters long')
});

const userSigninSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password should be at least 6 characters long')
});

const createTodo = z.object({
    title: z.string().min(3, 'Title should have at least 3 characters'),
    done: z.boolean().optional(),
    description: z.string().min(3,'Description should have atleast 3 characters').optional(),
})

app.post('/signup', async (req: Request, res: Response) => {
    try {
        const { email, firstName, lastName, password } = userSignupSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (existingUser) {
            res.status(400).json({ message: 'Email already exists' });
        } else {
            const newUser = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    password
                }
            });

            res.status(201).json({ message: 'User created successfully', user: newUser });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

app.post('/signin', async (req: Request, res: Response) => {
    try {
        const { email, password } = userSigninSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: {
                email: email,
                password: password
            }
        });

        if (user) {
            const payload = {
                id: user.id,
                email: user.email,
                fullName: user.password,
              };
          
              const token = jwt.sign(payload, "TODO_SECRET");
              
              
              res.cookie('token', token, {
                httpOnly: true,  
                secure: false,    
                sameSite: 'strict'
              });
            res.status(200).json({ message: 'Sign in successful', user: user });
        } else {
            res.status(400).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

app.post('/logout', authMiddleware,(req: Request, res: Response) => {
    try {
      res.clearCookie('token');
      res.status(200).json({ success: true, message: 'Logout successful' });
    } catch (error) {
      console.error(error)
      res.status(400).json({ success: false, message: 'Logout failed' });
    }
  });

app.post('/create', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { title, done, description } = createTodo.parse(req.body);

        
        const userId = req.user?.id;

        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
        }

        const newTodo = await prisma.todo.create({
            data: {
                title,
                done,
                description,
                userId,  
            }
        });

        res.status(201).json({ message: 'Todo created successfully', todo: newTodo });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

app.get('/fetch',authMiddleware,async (req:Request, res:Response) => {
    try{
    const userId = req.user?.id;
    const todos = await prisma.todo.findMany({
        where: {
            userId: userId, 
        },
    })
    res.status(200).json({ message: 'Todo fetched successfully', todo: todos });
   } catch(error) {
    res.status(500).json({message: 'Internal server error'});
   }
})



const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
