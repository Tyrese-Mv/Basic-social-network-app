import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  	return twMerge(clsx(inputs))
}

export const userDB: { email: string; passwordHash: string }[] = [];
export type Post = {
    PK: string;
    SK: string;
    content: string;
    username: string;
    timestamp?: number;
};