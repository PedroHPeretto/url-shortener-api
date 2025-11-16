import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { nanoid } from 'nanoid';
import { User } from '../users/entities/user.entity';
import { UpdateUrlDto } from './dto/update-url.dto';
import { ConfigService } from '@nestjs/config';
import { URLS_CONSTANTS } from './constants/urls.constants';

@Injectable()
export class UrlsService {
  private readonly logger = new Logger(UrlsService.name);
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
    private readonly configService: ConfigService,
  ) {
    const configured = this.configService.get<string>('BASE_URL');
    this.baseUrl = configured ? configured.replace(/\/+$/, '') : '';
  }

  async generateUniqueShortCode(): Promise<string> {
    for (
      let attempt = 1;
      attempt <= URLS_CONSTANTS.GENERATE_UNIQUE_SHORT_CODE_MAX_ATTEMPTS;
      attempt++
    ) {
      const code = nanoid(URLS_CONSTANTS.SHORT_CODE_LENGTH);
      const existing = await this.urlRepository.findOneBy({ short_code: code });

      if (!existing) {
        return code;
      }

      this.logger.warn(
        `Colisão de short codes detectada (attempt ${attempt}): ${code}`,
      );
    }

    throw new InternalServerErrorException(
      'Falha ao gerar código único após múltiplas tentativas. Tente novamente.',
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }

  async shortenUrl(createUrlDto: CreateUrlDto, user?: User) {
    const { original_url } = createUrlDto;

    if (!this.isValidUrl(original_url)) {
      throw new BadRequestException('URL fornecida é inválida');
    }

    const short_code = await this.generateUniqueShortCode();

    const newUrl = this.urlRepository.create({
      original_url,
      short_code,
      user: user,
    });

    await this.urlRepository.save(newUrl);

    return {
      ...newUrl,
      short_url: `${this.baseUrl}/${short_code}`,
    };
  }

  async findOriginalUrlAndCountClick(short_code: string) {
    const url = await this.urlRepository.findOneBy({
      short_code,
    });

    if (!url) {
      return null;
    }

    try {
      await this.urlRepository.increment({ id: url.id }, 'click_count', 1);
    } catch (error) {
      this.logger.error('Falha ao contabilizar clique:', error);
    }

    let { original_url } = url;

    if (
      !original_url.startsWith('http://') &&
      !original_url.startsWith('https://')
    ) {
      original_url = `${URLS_CONSTANTS.DEFAULT_PROTOCOL}://${original_url}`;
    }

    return original_url;
  }

  async findAllByUser(userId: string): Promise<Url[]> {
    return this.urlRepository.find({
      where: {
        user_id: userId,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  async update(
    updateUrlDto: UpdateUrlDto,
    userId: string,
    id: string,
  ): Promise<Url> {
    const url = await this.urlRepository.findOneBy({
      id,
      user_id: userId,
    });

    if (!url) {
      throw new NotFoundException(
        'Url não encontrada ou sua permissão foi negada',
      );
    }

    url.original_url = updateUrlDto.original_url;

    return this.urlRepository.save(url);
  }

  async delete(id: string, userId: string): Promise<void> {
    const url = await this.urlRepository.findOneBy({
      id,
      user_id: userId,
    });

    if (!url) {
      throw new NotFoundException(
        'Url não encontrada ou sua permissão foi negada',
      );
    }

    await this.urlRepository.softDelete(id);
  }
}
