import { AxiosError, AxiosHeaders } from 'axios';

import axiosErrorString, { getServerErrorMessage } from './axiosErrorString';

const makeAxiosError = (data: unknown, status = 400): AxiosError => {
  const error = new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() }
  });
  return error;
};

describe('axiosErrorString', () => {
  it('extracts top-level message from axios error response', () => {
    const err = makeAxiosError({ message: 'Email already exists' });
    expect(axiosErrorString(err)).toBe('Email already exists');
  });

  it('extracts nested data.data.message when top-level message is missing', () => {
    const err = makeAxiosError({ data: { message: 'Nested error' } });
    expect(axiosErrorString(err)).toBe('Nested error');
  });

  it('returns default message when axios error has no message fields', () => {
    const err = makeAxiosError({});
    expect(axiosErrorString(err)).toBe('An error occurred while processing your request.');
  });

  it('returns Error.message for standard Error', () => {
    expect(axiosErrorString(new Error('Something broke'))).toBe('Something broke');
  });

  it('returns generic message for unknown error types', () => {
    expect(axiosErrorString('some string')).toBe('An unknown error occurred.');
    expect(axiosErrorString(42)).toBe('An unknown error occurred.');
    expect(axiosErrorString(null)).toBe('An unknown error occurred.');
  });
});

describe('getServerErrorMessage', () => {
  it('extracts top-level message from axios error', () => {
    const err = makeAxiosError({ message: 'Validation failed' });
    expect(getServerErrorMessage(err)).toBe('Validation failed');
  });

  it('extracts nested data.data.message', () => {
    const err = makeAxiosError({ data: { message: 'Deep error' } });
    expect(getServerErrorMessage(err)).toBe('Deep error');
  });

  it('falls back to axios error.message when no response message', () => {
    const err = makeAxiosError({});
    expect(getServerErrorMessage(err)).toBe('Request failed');
  });

  it('returns Error.message for non-axios Error', () => {
    expect(getServerErrorMessage(new Error('Oops'))).toBe('Oops');
  });

  it('returns fallback for non-Error values', () => {
    expect(getServerErrorMessage('string')).toBe('Something went wrong');
    expect(getServerErrorMessage(null)).toBe('Something went wrong');
  });
});
