import fs from 'fs';
import { HapiFileStream } from '../../../types/hapi-file';
import { LocalStorageService } from '../LocalStorageService';

// Mocking the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
    pipe: jest.fn(),
  })),
}));

const mockedFs = jest.mocked(fs);

describe('LocalStorageService', () => {
  const folder = 'testing';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create the folder if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const storageService = new LocalStorageService(folder);

      expect(mockedFs.existsSync).toHaveBeenCalledWith(folder);
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(folder, { recursive: true });
      // eslint-disable-next-line dot-notation -- _folder is private
      expect(storageService['_folder']).toBe(folder);
    });

    it('should not create the folder if it already exists', () => {
      mockedFs.existsSync.mockReturnValue(true);

      const storageService = new LocalStorageService(folder);

      expect(mockedFs.existsSync).toHaveBeenCalledWith(folder);
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
      // eslint-disable-next-line dot-notation -- _folder is private
      expect(storageService['_folder']).toBe(folder);
    });
  });

  describe('writeFile', () => {
    const fakeMeta = { filename: 'test.txt', headers: {} };

    it('should write a file and return the filename', async () => {
      const storageService = new LocalStorageService(folder);

      const fakeFile = {
        pipe: jest.fn(),
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'end') {
            callback();
          }
        }),
      };

      const result = await storageService.writeFile(
        fakeFile as unknown as HapiFileStream,
        fakeMeta,
      );

      expect(mockedFs.createWriteStream).toHaveBeenCalled();
      expect(fakeFile.pipe).toHaveBeenCalled();
      expect(fakeFile.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(result).toMatch(/\d+test.txt/); // Check if the result is a filename with a timestamp
    });

    it('should reject with an error if writing the file encounters an error', async () => {
      const storageService = new LocalStorageService(folder);

      const fakeFile = { pipe: jest.fn(), on: jest.fn() };
      const fakeError = new Error('Fake error');

      mockedFs.createWriteStream.mockImplementationOnce(() => ({
        on: jest.fn((event: string, callback: (error: Error) => void) => {
          if (event === 'error') {
            callback(fakeError);
          }
        }),
        pipe: jest.fn(),
      }) as unknown as fs.WriteStream);

      await expect(storageService.writeFile(
        fakeFile as unknown as HapiFileStream,
        fakeMeta,
      )).rejects.toThrow(fakeError);
    });
  });
});
