import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { nanoid } from 'nanoid';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UrlsService {
  private readonly logger = new Logger(UrlsService.name);

  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
  ) {}

  async generateUniqueShortCode(): Promise<string> {
    const code = nanoid(6);
    const existing = await this.urlRepository.findOneBy({ short_code: code });

    if (existing) {
      this.logger.warn(`Colisão de short codes detectada: ${code}`);
    }

    return code;
  }

  async shortenUrl(createUrlDto: CreateUrlDto, user?: User) {
    const { original_url } = createUrlDto;

    const short_code = await this.generateUniqueShortCode();

    const newUrl = this.urlRepository.create({
      original_url,
      short_code,
      user: user,
    });

    await this.urlRepository.save(newUrl);

    return {
      ...newUrl,
      short_url: `http://localhost:3000/${short_code}`,
    };
  }

  async findOriginalUrlAndCountClick(short_code: string) {
    const url = await this.urlRepository.findOneBy({
      short_code,
    });

    if (!url) {
      return null;
    }

    void this.urlRepository
      .increment({ id: url.id }, 'click_count', 1)
      .catch((err) => {
        this.logger.error('Falha ao contabilizar clique:', err);
      });

    return url.original_url;
  }
}
