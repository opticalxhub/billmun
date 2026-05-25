import { NextResponse } from 'next/server';

type JsonInit = ResponseInit;

export function jsonPrivateNoStore<T>(body: T, init?: JsonInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export function jsonPublicCache<T>(body: T, cacheControl: string, init?: JsonInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', cacheControl);
  return response;
}
