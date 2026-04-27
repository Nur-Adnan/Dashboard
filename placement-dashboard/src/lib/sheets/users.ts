import { readSheet } from './client';
import type { User } from '@/types';

const HEADERS = ['id', 'name', 'email', 'role', 'active'];

function rowToUser(row: string[]): User & { password_hash: string } {
  return {
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] as User['role']) || 'mentor',
    active: row[4] === 'true',
    password_hash: row[5] || '',
  };
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const rows = await readSheet('users');
  const users = rows.map(rowToUser);
  return users.find(u => u.email === email) || null;
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await readSheet('users');
  return rows.map(row => ({
    id: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: (row[3] as User['role']) || 'mentor',
    active: row[4] === 'true',
  }));
}