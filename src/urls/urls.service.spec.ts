import { Test, TestingModule } from '@nestjs/testing';
import { UrlsService } from './urls.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Url } from './entities/url.entity';
import { ConfigService } from '@nestjs/config';
import { Repository, ObjectLiteral } from 'typeorm';
import { nanoid } from 'nanoid';
import { User } from '../users/entities/user.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { NotFoundException } from '@nestjs/common';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}));

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const mockUser: User = { id: 'user-uuid' } as User;

const mockUrl: Url = {
  id: 'url-uuid',
  original_url: 'https://google.com',
} as Url;

describe('UrlsService', () => {
  let service: UrlsService;
  let mockUrlRepository: MockRepository<Url>;
  let mockConfigService: Partial<ConfigService>;

  const mockRepositoryFactory = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    increment: jest.fn(() => ({
      catch: jest.fn(),
    })),
    find: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockConfigFactory = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };

  const userId = 'user-uuid';
  const urlId = 'url-uuid';

  beforeEach(async () => {
    Object.values(mockRepositoryFactory).forEach((mock) => mock.mockClear());
    mockConfigFactory.getOrThrow.mockClear();
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shortenUrl', () => {
    const createUrlDto: CreateUrlDto = { original_url: 'https://google.com' };

    it('Should shorten a url for an anonymous user', async () => {
      const mockCode = 'abcdef';

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

    it('Should shorten a url for an authenticated user', async () => {
      const mockCode = 'abcdef';

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

    it('Should handle short code collision', async () => {
      (nanoid as jest.Mock)
        .mockReturnValueOnce('collision')
        .mockReturnValueOnce('success');

      (mockUrlRepository.findOneBy as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-url' })
        .mockResolvedValueOnce(null);

      (mockUrlRepository.create as jest.Mock).mockReturnValue(mockUrl);
      (mockUrlRepository.save as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.shortenUrl(createUrlDto, undefined);

      expect(nanoid).toHaveBeenCalledTimes(2);
      expect(mockUrlRepository.findOneBy).toHaveBeenCalledTimes(2);
      expect(result.short_url).toEqual(`http://localhost:3000/success`);
    });
  });

  describe('findOriginalUrlAndCountClick', () => {
    it('should find url, increment click, and add protocol', async () => {
      const urlWithNoProtocol = {
        ...mockUrl,
        original_url: 'google.com',
        id: 'test-id',
      };
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(
        urlWithNoProtocol,
      );

      const result = await service.findOriginalUrlAndCountClick('123456');

      expect(mockUrlRepository.findOneBy).toHaveBeenCalledWith({
        short_code: '123456',
      });
      expect(mockUrlRepository.increment).toHaveBeenCalledWith(
        { id: urlWithNoProtocol.id },
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
  });

  describe('findAllByUser', () => {
    it('Should return an array of urls for a user', async () => {
      const mockUrls = [mockUrl, { ...mockUrl, id: 'url-uuid-2' }];

      (mockUrlRepository.find as jest.Mock).mockResolvedValue(mockUrls);

      const result = await service.findAllByUser(userId);

      expect(mockUrlRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: userId,
        },
        order: {
          created_at: 'DESC',
        },
      });
      expect(result).toEqual(mockUrls);
    });
  });

  describe('update', () => {
    const updateUrlDto: UpdateUrlDto = { original_url: 'https://youtube.com' };

    it('Should update a url successfully', async () => {
      const updatableUrl: Url = {
        ...mockUrl,
        original_url: 'https://google.com',
      };

      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(
        updatableUrl,
      );
      (mockUrlRepository.save as jest.Mock).mockResolvedValue({
        ...updatableUrl,
        ...updateUrlDto,
      });

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

    it('Should throw NotFoundException if url was not found or belongs to another user', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.update(updateUrlDto, userId, urlId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUrlRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('Should soft delete a url successfully', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(mockUrl);

      await service.delete(urlId, userId);

      expect(mockUrlRepository.findOneBy).toHaveBeenCalledWith({
        id: urlId,
        user_id: userId,
      });
      expect(mockUrlRepository.softDelete).toHaveBeenCalledWith(urlId);
    });

    it('Should throw NotFoundException if url was not found or belongs to another user', async () => {
      (mockUrlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(urlId, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUrlRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
