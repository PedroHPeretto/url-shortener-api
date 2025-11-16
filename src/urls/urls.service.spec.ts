import { Test, TestingModule } from '@nestjs/testing';
import { UrlsService } from './urls.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Url } from './entities/url.entity';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import {
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  createMockRepository,
  MockRepository,
} from '../../test/helpers/mock-repository';
import { createMockConfigService } from '../../test/helpers/mock-config';
import {
  createMockUrl,
  createMockUrlWithUser,
} from '../../test/fixtures/urls.fixture';
import { createMockUser } from '../../test/fixtures/users.fixture';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

describe('UrlsService', () => {
  let service: UrlsService;
  let mockUrlRepository: MockRepository<Url>;
  let mockConfigService: Partial<ConfigService>;

  const mockRepositoryFactory = createMockRepository<Url>();
  const mockConfigFactory = createMockConfigService();

  const userId = 'user-uuid';
  const urlId = 'url-uuid';

  beforeEach(async () => {
    Object.values(mockRepositoryFactory).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear();
      }
    });
    Object.values(mockConfigFactory).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear();
      }
    });
    (nanoid as jest.Mock).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        {
          provide: getRepositoryToken(Url),
          useValue: mockRepositoryFactory,
        },
        {
          provide: ConfigService,
          useValue: mockConfigFactory,
        },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    mockUrlRepository = mockRepositoryFactory;
    mockConfigService = mockConfigFactory;

    (mockConfigService.get as jest.Mock).mockReturnValue(
      'http://localhost:3000',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shortenUrl', () => {
    const createUrlDto: CreateUrlDto = { original_url: 'https://google.com' };

    it('should shorten a url for an anonymous user', async () => {
      const mockCode = 'abcdef';
      const mockUrl = createMockUrl({ short_code: mockCode });

      (nanoid as jest.Mock).mockReturnValue(mockCode);
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (mockUrlRepository.create as jest.Mock).mockReturnValue(mockUrl);
      (mockUrlRepository.save as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.shortenUrl(createUrlDto);

      expect(nanoid).toHaveBeenCalledWith(6);
      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        original_url: createUrlDto.original_url,
        short_code: mockCode,
        user: undefined,
      });
      expect(mockUrlRepository.save).toHaveBeenCalled();
      expect(result.short_url).toEqual(`http://localhost:3000/${mockCode}`);
    });

    it('should shorten a url for an authenticated user', async () => {
      const mockCode = 'abcdef';
      const mockUser = createMockUser();
      const mockUrl = createMockUrlWithUser(mockUser, {
        short_code: mockCode,
      });

      (nanoid as jest.Mock).mockReturnValue(mockCode);
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (mockUrlRepository.create as jest.Mock).mockReturnValue(mockUrl);
      (mockUrlRepository.save as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.shortenUrl(createUrlDto, mockUser);

      expect(mockUrlRepository.create).toHaveBeenCalledWith({
        original_url: createUrlDto.original_url,
        short_code: mockCode,
        user: mockUser,
      });
      expect(result.short_url).toEqual(`http://localhost:3000/${mockCode}`);
    });

    it('should handle short code collision with retry', async () => {
      (nanoid as jest.Mock)
        .mockReturnValueOnce('collision')
        .mockReturnValueOnce('success');

      (mockUrlRepository.findOneBy as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-url' })
        .mockResolvedValueOnce(null);

      const mockUrl = createMockUrl({ short_code: 'success' });
      (mockUrlRepository.create as jest.Mock).mockReturnValue(mockUrl);
      (mockUrlRepository.save as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.shortenUrl(createUrlDto, undefined);

      expect(nanoid).toHaveBeenCalledTimes(2);
      expect(mockUrlRepository.findOneBy).toHaveBeenCalledTimes(2);
      expect(result.short_url).toEqual(`http://localhost:3000/success`);
    });

    it('should handle database error during save', async () => {
      const mockCode = 'abcdef';
      const mockUrl = createMockUrl({ short_code: mockCode });

      (nanoid as jest.Mock).mockReturnValue(mockCode);
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (mockUrlRepository.create as jest.Mock).mockReturnValue(mockUrl);
      (mockUrlRepository.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service
        .shortenUrl(createUrlDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Database error');
    });

    it('should throw BadRequestException for invalid URL', async () => {
      const invalidUrlDto: CreateUrlDto = {
        original_url: 'not a valid url at all',
      };

      const error = await service
        .shortenUrl(invalidUrlDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as Error).message).toBe('URL fornecida é inválida');
      expect(mockUrlRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on unique code generation failure', async () => {
      const mockCode = 'abcdef';
      (nanoid as jest.Mock).mockReturnValue(mockCode);
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue({
        id: 'existing-url',
      });

      const error = await service
        .shortenUrl(createUrlDto)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect((error as Error).message).toContain('Falha ao gerar código único');
    });
  });

  describe('findOriginalUrlAndCountClick', () => {
    it('should find url, increment click, and add protocol', async () => {
      const baseUrl = createMockUrl({
        original_url: 'google.com',
        id: 'test-id',
      });

      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(baseUrl);

      const result = await service.findOriginalUrlAndCountClick('123456');

      expect(mockUrlRepository.findOneBy).toHaveBeenCalledWith({
        short_code: '123456',
      });
      expect(mockUrlRepository.increment).toHaveBeenCalledWith(
        { id: baseUrl.id },
        'click_count',
        1,
      );
      expect(result).toEqual('https://google.com');
    });

    it('should return null if url was not found', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await service.findOriginalUrlAndCountClick('notfound');

      expect(result).toBeNull();
      expect(mockUrlRepository.increment).not.toHaveBeenCalled();
    });

    it('should not add protocol if already present (https)', async () => {
      const baseUrl = createMockUrl({
        original_url: 'https://google.com',
      });

      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(baseUrl);

      const result = await service.findOriginalUrlAndCountClick('abc123');

      expect(result).toEqual('https://google.com');
    });

    it('should not add protocol if already present (http)', async () => {
      const baseUrl = createMockUrl({
        original_url: 'http://google.com',
      });

      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(baseUrl);

      const result = await service.findOriginalUrlAndCountClick('abc123');

      expect(result).toEqual('http://google.com');
    });

    it('should handle increment error gracefully', async () => {
      const baseUrl = createMockUrl();
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(baseUrl);
      (mockUrlRepository.increment as jest.Mock).mockReturnValue({
        catch: (cb: (err: Error) => void) => cb(new Error('Increment failed')),
      });

      const result = await service.findOriginalUrlAndCountClick('abc123');

      // Should still return URL despite increment error
      expect(result).toBeDefined();
    });
  });

  describe('findAllByUser', () => {
    it('should return an array of urls for a user', async () => {
      const mockUser = createMockUser();
      const mockUrls = [
        createMockUrlWithUser(mockUser),
        createMockUrlWithUser(mockUser, { id: 'url-uuid-2' }),
      ];

      (mockUrlRepository.find as jest.Mock).mockResolvedValue(mockUrls);

      const result = await service.findAllByUser(mockUser.id);

      expect(mockUrlRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: mockUser.id,
        },
        order: {
          created_at: 'DESC',
        },
      });
      expect(result).toEqual(mockUrls);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no urls', async () => {
      (mockUrlRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual([]);
    });

    it('should handle database error', async () => {
      (mockUrlRepository.find as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service.findAllByUser(userId).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('update', () => {
    const updateUrlDto: UpdateUrlDto = { original_url: 'https://youtube.com' };

    it('should update a url successfully', async () => {
      const baseUrl = createMockUrl({
        id: urlId,
        original_url: 'https://google.com',
      });
      const updatedUrl = createMockUrl({
        id: urlId,
        original_url: updateUrlDto.original_url,
      });

      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(baseUrl);
      (mockUrlRepository.save as jest.Mock).mockResolvedValue(updatedUrl);

      const result = await service.update(updateUrlDto, userId, urlId);

      expect(mockUrlRepository.findOneBy).toHaveBeenCalledWith({
        id: urlId,
        user_id: userId,
      });
      expect(mockUrlRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: urlId,
          original_url: updateUrlDto.original_url,
        }),
      );
      expect(result.original_url).toEqual(updateUrlDto.original_url);
    });

    it('should throw NotFoundException if url was not found', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const error = await service
        .update(updateUrlDto, userId, urlId)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(NotFoundException);
      expect(mockUrlRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if url belongs to another user', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const error = await service
        .update(updateUrlDto, userId, urlId)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(NotFoundException);
    });

    it('should handle database error during update', async () => {
      const baseUrl = createMockUrl({ id: urlId });
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(baseUrl);
      (mockUrlRepository.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service
        .update(updateUrlDto, userId, urlId)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('delete', () => {
    it('should soft delete a url successfully', async () => {
      const mockUrl = createMockUrl({ id: urlId });
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(mockUrl);

      await service.delete(urlId, userId);

      expect(mockUrlRepository.findOneBy).toHaveBeenCalledWith({
        id: urlId,
        user_id: userId,
      });
      expect(mockUrlRepository.softDelete).toHaveBeenCalledWith(urlId);
    });

    it('should throw NotFoundException if url was not found', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const error = await service.delete(urlId, userId).catch((e: Error) => e);

      expect(error).toBeInstanceOf(NotFoundException);
      expect(mockUrlRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if url belongs to another user', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      const error = await service.delete(urlId, userId).catch((e: Error) => e);

      expect(error).toBeInstanceOf(NotFoundException);
    });

    it('should handle database error during soft delete', async () => {
      const mockUrl = createMockUrl({ id: urlId });
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(mockUrl);
      (mockUrlRepository.softDelete as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const error = await service.delete(urlId, userId).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
    });
  });
});
