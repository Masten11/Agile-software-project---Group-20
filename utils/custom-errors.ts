export class InvalidPayloadError extends Error {
  constructor(message = 'invalid request body') {
    super(message);
    this.name = 'InvalidPayloadError';
  }
}

export class UnsupportedCategoryError extends Error {
  constructor(category: string) {
    super(`category "${category}" is not supported.`);
    this.name = 'UnsupportedCategoryError';
  }
}

export class EmissionNotFoundError extends Error {
  constructor(message = 'emission entry not found for this user') {
    super(message);
    this.name = 'EmissionNotFoundError';
  }
}
