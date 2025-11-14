import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Redirect,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async shortenUrl(
    @Body() createUrlDto: CreateUrlDto,
    @GetUser('user') user: User,
  ) {
    return this.urlsService.shortenUrl(createUrlDto, user);
  }

  @Get(':short_code')
  @Redirect()
  async redirect(@Param('short_code') short_code: string) {
    const originalUrl =
      await this.urlsService.findOriginalUrlAndCountClick(short_code);

    if (!originalUrl) {
      throw new NotFoundException('Url não encontrada ou expirada');
    }

    return {
      url: originalUrl,
      statusCode: HttpStatus.FOUND,
    };
  }
}
