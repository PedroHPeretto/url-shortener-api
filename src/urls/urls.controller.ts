import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Redirect,
  Delete,
} from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Url } from './entities/url.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdateUrlDto } from './dto/update-url.dto';

@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async shortenUrl(
    @Body() createUrlDto: CreateUrlDto,
    @GetUser('user') user: User,
  ) {
    return this.urlsService.shortenUrl(createUrlDto, user);
  }

  @Redirect()
  @Get(':short_code')
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

  @UseGuards(JwtAuthGuard)
  @Get('my-links/links')
  async getUserLinks(@GetUser('user') user: User): Promise<Url[]> {
    const userId = user.id;

    return this.urlsService.findAllByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('my-links/:id')
  async updateLink(
    @GetUser('user') user: User,
    id: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ) {
    const userId = user.id;

    return this.urlsService.update(updateUrlDto, userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-links/:id')
  async softDeleteUrl(@GetUser('user') user: User, @Param('id') id: string) {
    const userId = user.id;

    return this.urlsService.delete(id, userId);
  }
}
