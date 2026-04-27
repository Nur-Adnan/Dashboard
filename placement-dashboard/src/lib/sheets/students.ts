import { readSheet, appendRow, updateRow, findRowIndex } from './client';
import type { Student, StudentStage, RiskStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const HEADERS = ['id', 'name', 'batch', 'mentor_email', 'stage', 'risk_status', 'risk_reasons', 'last_activity_date', 'created_at', 'updated_at'];

function rowToStudent(row: string[]): Student {
  return {
    id: row[0] || '',
    name: row[1] || '',
    batch: row[2] || '',
    mentor_email: row[3] || '',
    stage: (row[4] as StudentStage) || 'learning',
    risk_status: (row[5] as RiskStatus) || 'safe',
    risk_reasons: row[6] || '',
    last_activity_date: row[7] || '',
    created_at: row[8] || '',
    updated_at: row[9] || '',
  };
}

function studentToRow(student: Partial<Student>): unknown[] {
  return [
    student.id || '',
    student.name || '',
    student.batch || '',
    student.mentor_email || '',
    student.stage || 'learning',
    student.risk_status || 'safe',
    student.risk_reasons || '',
    student.last_activity_date || '',
    student.created_at || '',
    student.updated_at || '',
  ];
}

export async function getAllStudents(): Promise<Student[]> {
  const rows = await readSheet('students');
  return rows.map(rowToStudent);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const students = await getAllStudents();
  return students.find(s => s.id === id) || null;
}

export async function createStudent(data: Pick<Student, 'name' | 'batch' | 'mentor_email'>): Promise<Student> {
  const now = new Date().toISOString();
  const student: Student = {
    id: uuidv4(),
    name: data.name,
    batch: data.batch,
    mentor_email: data.mentor_email,
    stage: 'learning',
    risk_status: 'safe',
    risk_reasons: '',
    last_activity_date: now,
    created_at: now,
    updated_at: now,
  };
  await appendRow('students', studentToRow(student));
  return student;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student | null> {
  const rowIndex = await findRowIndex('students', 0, id);
  if (rowIndex === -1) return null;
  
  const existing = await getStudentById(id);
  if (!existing) return null;
  
  const updated: Student = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };
  
  await updateRow('students', rowIndex + 1, studentToRow(updated));
  return updated;
}

export async function getStudentsByMentor(mentorEmail: string): Promise<Student[]> {
  const students = await getAllStudents();
  return students.filter(s => s.mentor_email === mentorEmail);
}

export async function filterStudents(filters: { stage?: StudentStage; risk_status?: RiskStatus; batch?: string; mentor_email?: string }): Promise<Student[]> {
  let students = await getAllStudents();
  
  if (filters.stage) {
    students = students.filter(s => s.stage === filters.stage);
  }
  if (filters.risk_status) {
    students = students.filter(s => s.risk_status === filters.risk_status);
  }
  if (filters.batch) {
    students = students.filter(s => s.batch === filters.batch);
  }
  if (filters.mentor_email) {
    students = students.filter(s => s.mentor_email === filters.mentor_email);
  }
  
  return students;
}