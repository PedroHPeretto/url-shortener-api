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
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdateUrlDto } from './dto/update-url.dto';
import { plainToInstance } from 'class-transformer';
import { UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { UrlResponseDto } from './dto/url-response.dto';
import { UrlRedirectResponse } from './dto/redirect-response.dto';
import { UserUrlsResponseDto } from './dto/user-urls-response.dto';

@Controller()
@ApiTags('urls')
export class UrlsController {
  private readonly logger = new Logger(UrlsController.name);

  constructor(private readonly urlsService: UrlsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Url shortener' })
  @ApiBody({ type: CreateUrlDto })
  @ApiResponse({
    status: 201,
    description: 'Url shortened successfully',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Url provided is invalid',
  })
  async shortenUrl(
    @Body() createUrlDto: CreateUrlDto,
    @GetUser('user') user: User,
  ): Promise<UrlResponseDto> {
    const service = await this.urlsService.shortenUrl(createUrlDto, user);
    this.logger.log(`Url: ${createUrlDto.original_url} shortened`);
    return plainToInstance(UrlResponseDto, service);
  }

  @Redirect()
  @Get(':short_code')
  @ApiOperation({
    summary: 'Redirect to original url based on short code',
  })
  @ApiParam({
    name: 'short_code',
    description: 'Url short code',
    example: 'abc123',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to original url',
    type: UrlRedirectResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Url not found',
  })
  async redirect(
    @Param('short_code') short_code: string,
  ): Promise<UrlRedirectResponse> {
    const originalUrl =
      await this.urlsService.findOriginalUrlAndCountClick(short_code);

    this.logger.log(`User redirected to ${originalUrl}`);
    return new UrlRedirectResponse(originalUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-links/links')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all urls form authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User urls list',
    isArray: true,
    type: UserUrlsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getUserLinks(
    @GetUser('user') user: User,
  ): Promise<UserUrlsResponseDto> {
    const userId = user.id;
    const service = await this.urlsService.findAllByUser(userId);

    this.logger.log(`User: ${userId} urls returned`);
    return plainToInstance(UserUrlsResponseDto, { urls: service });
  }

  @UseGuards(JwtAuthGuard)
  @Put('my-links/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user existing url' })
  @ApiParam({
    name: 'id',
    description: 'Url id to be updated',
  })
  @ApiBody({ type: UpdateUrlDto })
  @ApiResponse({
    status: 200,
    description: 'Url updated successfully',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Url not found or permission denied',
  })
  async updateLink(
    @GetUser('user') user: User,
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ): Promise<UrlResponseDto> {
    const userId = user.id;
    const service = await this.urlsService.update(updateUrlDto, userId, id);

    this.logger.log(`Short code updated to ${updateUrlDto.original_url}`);
    return plainToInstance(UrlResponseDto, service);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('my-links/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user url' })
  @ApiParam({
    name: 'id',
    description: 'Url id to be deleted',
  })
  @ApiResponse({
    status: 204,
    description: 'Url deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Url not found or permission denied',
  })
  async softDeleteUrl(
    @GetUser('user') user: User,
    @Param('id') id: string,
  ): Promise<void> {
    const userId = user.id;

    this.logger.log(`Url: ${id} deleted`);
    return this.urlsService.delete(id, userId);
  }
}
