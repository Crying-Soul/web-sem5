import { CreateBookPayload, UpdateBookPayload, BorrowPayload, CreateBookDTO, UpdateBookDTO, BorrowDTO, ApiResponse } from '../types/api.type.js';

// String utilities
export function toStr(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t === '' ? undefined : t;
  }
  if (typeof v === 'number') return String(v);
  return undefined;
}

// Validation utilities
export function isValidISODateString(s: string): boolean {
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export function isValidISBN(s: string): boolean {
  const cleaned = s.replace(/[\s-]/g, '');
  return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned);
}

export function isValidBorrowPeriod(days: number): boolean {
  return Number.isInteger(days) && days >= 1 && days <= 365;
}

// Request validation
export function validateCreateBookPayload(payload: CreateBookPayload): { errors: string[]; value?: CreateBookDTO } {
  const errors: string[] = [];

  const title = toStr(payload.title);
  const author = toStr(payload.author);
  const publicationDateRaw = toStr(payload.publicationDate);
  const isbn = toStr(payload.isbn);
  const coverImageRaw = payload.coverImage == null ? null : toStr(payload.coverImage) ?? null;

  if (!title) errors.push('Title is required');
  if (!author) errors.push('Author is required');
  if (!publicationDateRaw) errors.push('Publication date is required');
  if (!isbn) errors.push('ISBN is required');

  if (publicationDateRaw) {
    if (!isValidISODateString(publicationDateRaw)) {
      errors.push('Publication date is invalid');
    } else {
      const pub = new Date(publicationDateRaw);
      if (pub > new Date()) errors.push('Publication date cannot be in the future');
    }
  }

  if (isbn && !isValidISBN(isbn)) {
    errors.push('ISBN looks invalid (expect 10 or 13 digits)');
  }

  if (errors.length > 0) return { errors };

  const value: CreateBookDTO = {
    title: title!,
    author: author!,
    publicationDate: publicationDateRaw!,
    isbn: isbn!,
    coverImage: coverImageRaw
  };

  return { errors: [], value };
}

export function validateUpdateBookPayload(payload: UpdateBookPayload): { errors: string[]; value?: UpdateBookDTO } {
  const errors: string[] = [];
  const value: UpdateBookDTO = {};

  if (payload.title !== undefined) {
    const title = toStr(payload.title);
    if (!title) errors.push('Title cannot be empty');
    else value.title = title;
  }

  if (payload.author !== undefined) {
    const author = toStr(payload.author);
    if (!author) errors.push('Author cannot be empty');
    else value.author = author;
  }

  if (payload.publicationDate !== undefined) {
    const publicationDate = toStr(payload.publicationDate);
    if (!publicationDate) errors.push('Publication date cannot be empty');
    else if (!isValidISODateString(publicationDate)) errors.push('Publication date is invalid');
    else {
      const pub = new Date(publicationDate);
      if (pub > new Date()) errors.push('Publication date cannot be in the future');
      else value.publicationDate = publicationDate;
    }
  }

  if (payload.isbn !== undefined) {
    const isbn = toStr(payload.isbn);
    if (!isbn) errors.push('ISBN cannot be empty');
    else if (!isValidISBN(isbn)) errors.push('ISBN looks invalid');
    else value.isbn = isbn;
  }

  if (payload.coverImage !== undefined) {
    value.coverImage = payload.coverImage == null ? null : toStr(payload.coverImage) ?? null;
  }

  if (errors.length > 0) return { errors };
  return { errors: [], value };
}

export function validateBorrowPayload(payload: BorrowPayload): { errors: string[]; value?: BorrowDTO } {
  const errors: string[] = [];
  const borrowerName = toStr(payload.borrowerName);
  const daysRaw = payload.days;

  if (!borrowerName) errors.push('Borrower name is required');

  const days = Number(daysRaw);
  if (!isValidBorrowPeriod(days)) {
    errors.push('Borrow period must be an integer between 1 and 365 days');
  }

  if (errors.length > 0) return { errors };
  return { errors: [], value: { borrowerName: borrowerName!, days } };
}

// Response utilities
export function createApiResponse<T = any>(
  success: boolean, 
  data?: T, 
  message?: string, 
  error?: string
): ApiResponse<T> {
  return { success, data, message, error };
}

export function createSuccessResponse<T = any>(data?: T, message?: string): ApiResponse<T> {
  return createApiResponse(true, data, message);
}

export function createErrorResponse(message: string): ApiResponse {
  return createApiResponse(false, undefined, undefined, message);
}

// Request type detection
export function isAjaxRequest(req: any): boolean {
    const requestedWith = req.headers['x-requested-with'];
    const accept = req.headers.accept || '';
    
    return !!(req.xhr || 
              requestedWith === 'XMLHttpRequest' || 
              accept.includes('application/json') ||
              req.headers['content-type']?.includes('application/json'));
}

