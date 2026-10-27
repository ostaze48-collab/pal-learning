export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function studentHeaders(json = false): HeadersInit {
  const headers: Record<string,string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pal_student_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function apiJson<T>(path:string, init:RequestInit = {}, auth = false):Promise<T> {
  const headers = new Headers(init.headers || {});
  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem('pal_student_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API}${path}`, {...init, headers});
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `HTTP ${response.status}`);
  return body as T;
}

export async function findFirstPublishedLesson(){
  const books = await apiJson<any[]>('/curriculum/books');
  const book = books.find(x => x.book_code === 'PS.G05.SCI.S2') || books[0];
  if (!book) return null;
  const units = await apiJson<any[]>(`/curriculum/books/${book.id}/units`);
  for (const unit of units) {
    const lessons = await apiJson<any[]>(`/curriculum/units/${unit.id}/lessons`);
    const lesson = lessons.find(x => x.status === 'PUBLISHED') || lessons[0];
    if (lesson) return {book, unit, lesson};
  }
  return null;
}
