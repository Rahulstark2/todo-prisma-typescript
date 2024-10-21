import { Request,Response, NextFunction } from "express";
const jwt = require('jsonwebtoken');

interface User {
  id: number;
  email: string;
  fullName: string;
  iat: number;
}

interface CustomRequest extends Request {
  user?: User;
}


export const authMiddleware = (req: CustomRequest, res:Response, next:NextFunction) => {
   
    const token = req.cookies.token;
    
    
    if (!token) {
      res.status(401).json({ message: 'Access Denied. No token provided.' });
    }
  
    try {

      const decoded = jwt.verify(token, "TODO_SECRET") as User;
      req.user=decoded;
      next(); 
    } catch (error) {
      console.log(error)
      res.status(400).json({ message: 'Invalid Token' });
    }
};

