

import { User } from './middleware';  

declare global {
  namespace Express {
    interface Request {
      user?: User; 
    }
  }
}
