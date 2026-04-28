import { TransportationInput } from './transportation/types';

export enum Category {
  Transportation = 'transportation',
}

export type LogHabitRequest = {
  category: Category.Transportation;
  body: TransportationInput ; //Here we add by union more input types
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

export function parseLogHabitRequest(payload: unknown): LogHabitRequest | null {
  if (!isObject(payload) || typeof payload.category !== 'string' || !('body' in payload)) {
    return null;
  }

  if (payload.category === Category.Transportation && isTransportationInput(payload.body)) {
    return {
      category: Category.Transportation,
      body: payload.body,
    };
  }

  return null;
}
