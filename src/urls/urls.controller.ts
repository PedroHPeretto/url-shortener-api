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
  Redirect,
  Delete,
  Logger,
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
  private readonly logger = new Logger(UrlsController.name);

  constructor(private readonly urlsService: UrlsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async shortenUrl(
    @Body() createUrlDto: CreateUrlDto,
    @GetUser('user') user: User,
  ): Promise<Url> {
    this.logger.log(`Url: ${createUrlDto.original_url} shortened`);
    return this.urlsService.shortenUrl(createUrlDto, user);
  }

  @Redirect()
  @Get(':short_code')
  async redirect(
    @Param('short_code') short_code: string,
  ): Promise<{ url: string | null; statusCode: number }> {
    const originalUrl =
      await this.urlsService.findOriginalUrlAndCountClick(short_code);

    this.logger.log(`User redirected to ${originalUrl}`);
    return {
      url: originalUrl,
      statusCode: HttpStatus.FOUND,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-links/links')
  async getUserLinks(@GetUser('user') user: User): Promise<Url[]> {
    const userId = user.id;

    this.logger.log(`User: ${userId} urls returned`);
    return this.urlsService.findAllByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('my-links/:id')
  async updateLink(
    @GetUser('user') user: User,
    id: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ): Promise<Url> {
    const userId = user.id;

    this.logger.log(`Short code updated to ${updateUrlDto.original_url}`);
    return this.urlsService.update(updateUrlDto, userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-links/:id')
  async softDeleteUrl(
    @GetUser('user') user: User,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = user.id;

    this.logger.log(`Url: ${id} deleted`);
    return this.urlsService.delete(id, userId);
  }
}
