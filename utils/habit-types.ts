import { TransportationInput } from './transportation/types';

export enum Category {
  Transportation = 'transport',
}

export type LogHabitRequest = {
  category: Category.Transportation;
  body: TransportationInput ; //Here we add by union more input types
};

export type UnlogHabitRequest = {
  category: Category;
  body: {
    id: string;
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTransportationInput(value: unknown): value is TransportationInput {
  if (!isObject(value)) {
    return false;
  }

  const validModes = new Set(['car', 'bus', 'train', 'plane', 'bike']);

  return (
    typeof value.start === 'string' &&
    typeof value.destination === 'string' &&
    typeof value.transportMode === 'string' &&
    validModes.has(value.transportMode)
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isUnlogBody(value: unknown): value is UnlogHabitRequest['body'] {
  if (!isObject(value) || typeof value.id !== 'string') {
    return false;
  }

  return isUuid(value.id);
}

export function parseLogHabitRequest(payload: unknown): LogHabitRequest | null {
  if (!isObject(payload) || typeof payload.category !== 'string' || !('body' in payload)) {
    return null;
  }

  if (payload.category === Category.Transportation && isTransportationInput(payload.body)) {
    return {
      category: Category.Transportation,
      body: payload.body,
    }; // type is transportationInput
  }

  return null;
}

export function parseUnlogHabitRequest(payload: unknown): UnlogHabitRequest | null {
  if (!isObject(payload) || typeof payload.category !== 'string' || !('body' in payload)) {
    return null;
  }

  if (!Object.values(Category).includes(payload.category as Category)) {
    return null;
  }

  if (!isUnlogBody(payload.body)) {
    return null;
  }

  return {
    category: payload.category as Category,
    body: payload.body
  };
}
