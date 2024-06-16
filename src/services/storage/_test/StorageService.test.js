/* eslint-disable no-undef */
const fs = require('fs');
const StorageService = require('../StorageService');

// Mocking the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
    pipe: jest.fn(),
  })),
}));

describe('StorageService', () => {
  const folder = 'testing';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create the folder if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const storageService = new StorageService(folder);

      expect(fs.existsSync).toHaveBeenCalledWith(folder);
      expect(fs.mkdirSync).toHaveBeenCalledWith(folder, { recursive: true });
      expect(storageService._folder).toBe(folder);
    });

    it('should not create the folder if it already exists', () => {
      fs.existsSync.mockReturnValue(true);

      const storageService = new StorageService(folder);

      expect(fs.existsSync).toHaveBeenCalledWith(folder);
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(storageService._folder).toBe(folder);
    });
  });

  describe('writeFile', () => {
    it('should write a file and return the filename', async () => {
      const storageService = new StorageService(folder);

      const fakeFile = {
        pipe: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            callback();
          }
        }),
      };
      const fakeMeta = { filename: 'test.txt' };

      const result = await storageService.writeFile(fakeFile, fakeMeta);

      expect(fs.createWriteStream).toHaveBeenCalled();
      expect(fakeFile.pipe).toHaveBeenCalled();
      expect(fakeFile.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(result).toMatch(/\d+test.txt/); // Check if the result is a filename with a timestamp
    });

    it('should reject with an error if writing the file encounters an error', async () => {
      const storageService = new StorageService(folder);

      const fakeFile = { pipe: jest.fn(), on: jest.fn() };
      const fakeMeta = { filename: 'test.txt' };
      const fakeError = new Error('Fake error');

      fs.createWriteStream.mockImplementation(() => ({
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(fakeError);
          }
        }),
        pipe: jest.fn(),
      }));

      await expect(storageService.writeFile(fakeFile, fakeMeta)).rejects.toThrow(fakeError);
    });
  });
});
