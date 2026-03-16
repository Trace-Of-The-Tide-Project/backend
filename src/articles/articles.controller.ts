import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import {
    CreateArticleDto,
    UpdateArticleDto,
    CreateArticleBlockDto,
    UpdateArticleBlockDto,
    AddContributorDto,
} from './dto/article.dto';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
    ApiTags,
    ApiOperation,
    ApiQuery,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
    constructor(private readonly articlesService: ArticlesService) { }

    // ═══════════════════════════════════════════════════════════
    // ARTICLES CRUD
    // ═══════════════════════════════════════════════════════════

    @Get()
    @ApiOperation({ summary: 'List all articles with pagination, search, filters' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published', 'scheduled', 'archived', 'flagged'] })
    @ApiQuery({ name: 'content_type', required: false, enum: ['article', 'video', 'audio', 'thread', 'artwork', 'figma', 'trip', 'open_call'] })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'] })
    @ApiQuery({ name: 'sortBy', required: false })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
    findAll(@Query() query: any) {
        return this.articlesService.findAll(query);
    }

    @Get('author/me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user\'s articles' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    myArticles(@Req() req: any, @Query() query: any) {
        return this.articlesService.findByAuthor(req.user.sub, query);
    }

    @Get('author/me/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user\'s article stats (published, drafts, views)' })
    myStats(@Req() req: any) {
        return this.articlesService.getAuthorStats(req.user.sub);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get article by slug (public page)' })
    findBySlug(@Param('slug') slug: string) {
        return this.articlesService.findBySlug(slug);
    }

    @Get('collection/:collectionId')
    @ApiOperation({ summary: 'Get articles in a collection with stats (count, total hours)' })
    getCollectionArticles(@Param('collectionId') collectionId: string) {
        return this.articlesService.getCollectionArticles(collectionId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get article by ID with blocks, contributors, tags, collection' })
    findOne(@Param('id') id: string) {
        return this.articlesService.findOne(id);
    }

    @Get(':id/related')
    @ApiOperation({
        summary: 'Get related articles (same category/tags)',
        description: 'Returns up to 4 related published articles based on shared category and tags.',
    })
    @ApiResponse({ status: 200, description: 'Array of related articles' })
    getRelated(@Param('id') id: string) {
        return this.articlesService.getRelatedArticles(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new article (draft) with optional blocks and tags' })
    create(@Body() dto: CreateArticleDto, @Req() req: any) {
        return this.articlesService.createArticle(dto, req.user.sub);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update article (author only — replaces blocks/tags if provided)' })
    update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: any) {
        return this.articlesService.updateArticle(id, dto, req.user.sub);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete article (admin only)' })
    remove(@Param('id') id: string) {
        return this.articlesService.remove(id);
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLISHING WORKFLOW
    // ═══════════════════════════════════════════════════════════

    @Patch(':id/publish')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish article (requires at least 1 block, recalculates reading time)' })
    publish(@Param('id') id: string) {
        return this.articlesService.publishArticle(id);
    }

    @Patch(':id/schedule')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Schedule article for future publishing' })
    schedule(@Param('id') id: string, @Body('scheduled_at') scheduledAt: string) {
        return this.articlesService.scheduleArticle(id, scheduledAt);
    }

    @Patch(':id/archive')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Archive article' })
    archive(@Param('id') id: string) {
        return this.articlesService.archiveArticle(id);
    }

    @Patch(':id/unpublish')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Revert article to draft' })
    unpublish(@Param('id') id: string) {
        return this.articlesService.unpublishArticle(id);
    }

    // ═══════════════════════════════════════════════════════════
    // VIEW TRACKING
    // ═══════════════════════════════════════════════════════════

    @Post(':id/view')
    @ApiOperation({ summary: 'Increment view count (call when article page loads)' })
    trackView(@Param('id') id: string) {
        return this.articlesService.incrementView(id);
    }

    // ═══════════════════════════════════════════════════════════
    // BLOCKS
    // ═══════════════════════════════════════════════════════════

    @Get(':id/blocks')
    @ApiOperation({ summary: 'Get all blocks for an article (ordered)' })
    getBlocks(@Param('id') id: string) {
        return this.articlesService.getBlocks(id);
    }

    @Post(':id/blocks')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a content block to an article' })
    addBlock(@Param('id') id: string, @Body() dto: CreateArticleBlockDto) {
        return this.articlesService.addBlock(id, dto);
    }

    @Patch(':id/blocks/reorder')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reorder blocks — send array of block IDs in desired order' })
    reorderBlocks(@Param('id') id: string, @Body('blockIds') blockIds: string[]) {
        return this.articlesService.reorderBlocks(id, blockIds);
    }

    @Patch(':id/blocks/:blockId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a content block' })
    updateBlock(
        @Param('id') id: string,
        @Param('blockId') blockId: string,
        @Body() dto: UpdateArticleBlockDto,
    ) {
        return this.articlesService.updateBlock(id, blockId, dto);
    }

    @Delete(':id/blocks/:blockId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove a content block' })
    removeBlock(@Param('id') id: string, @Param('blockId') blockId: string) {
        return this.articlesService.removeBlock(id, blockId);
    }

    // ═══════════════════════════════════════════════════════════
    // CONTRIBUTORS
    // ═══════════════════════════════════════════════════════════

    @Get(':id/contributors')
    @ApiOperation({ summary: 'List contributors of an article' })
    getContributors(@Param('id') id: string) {
        return this.articlesService.getContributors(id);
    }

    @Post(':id/contributors')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add a contributor to an article' })
    addContributor(@Param('id') id: string, @Body() dto: AddContributorDto) {
        return this.articlesService.addContributor(id, dto);
    }

    @Delete(':id/contributors/:contributorId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove a contributor' })
    removeContributor(@Param('id') id: string, @Param('contributorId') contributorId: string) {
        return this.articlesService.removeContributor(id, contributorId);
    }

}
