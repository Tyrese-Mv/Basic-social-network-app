import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import cookie from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET!;

//For frontend

const signup = async (email: string, password: string, name: string, surname: string, username: string) => {
    const userData = {
        "email": email,
        "password": password,
        "name": name,
        "surname": surname,
        "username": username
    }
    const response = await fetch("api/signup", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData)
    });
    return response.json();
}

//For frontend
const login = async (email: string, password: string) => {
    const userData = {
        "email": email,
        "password": password
    }
    const response = await fetch("api/login", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.message || 'Login failed') as Error & { response?: { data: unknown } };
        error.response = { data };
        throw error;
    }
    return data;
}
export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.log(error)
        return null;
    }
  }

  export function getUserFromRequest(req: NextApiRequest): { userId: string, email: string } | null {
    try {
      const cookies = cookie.parse(req.headers.cookie || '');
      const token = cookies.token;
      if (!token) return null;
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
      return decoded;
    } catch {
      return null;
    }
  }


export { signup, login };