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
import { BoardsService } from './boards.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';
import { Roles } from '../auth/jwt/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CreateBoardDto,
  UpdateBoardDto,
  AddBoardMemberDto,
  UpdateBoardMemberDto,
  CreateBoardPageDto,
  UpdateBoardPageDto,
  CreateBoardElementDto,
  UpdateBoardElementDto,
  ReorderElementsDto,
  CreateBoardConnectorDto,
  UpdateBoardConnectorDto,
  CreateBoardChatDto,
  CreateBoardCommentDto,
  UpdateBoardCommentDto,
  CreateBoardTemplateDto,
} from './dto/board.dto';

@ApiTags('Boards')
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  // ─── Templates (must be before :id routes) ──────────────

  @Get('templates')
  @ApiOperation({ summary: 'List available board templates' })
  @ApiQuery({ name: 'category', required: false })
  getTemplates(@Query() query: any) {
    return this.boardsService.getTemplates(query);
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get a board template' })
  getTemplate(@Param('templateId') templateId: string) {
    return this.boardsService.getTemplate(templateId);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a board template (admin only)' })
  createTemplate(@Body() dto: CreateBoardTemplateDto, @Req() req: any) {
    return this.boardsService.createTemplate(dto, req.user.sub);
  }

  @Post('from-template/:templateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a board from a template' })
  createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { title?: string },
    @Req() req: any,
  ) {
    return this.boardsService.createBoardFromTemplate(
      templateId,
      req.user.sub,
      body.title,
    );
  }

  // ─── Board CRUD ─────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all boards with search and pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: any) {
    return this.boardsService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new board (auto-creates Page 1 and owner member)',
  })
  create(@Body() dto: CreateBoardDto, @Req() req: any) {
    return this.boardsService.createBoard(dto, req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a board with pages and members' })
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a board (editor+ only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @Req() req: any,
  ) {
    return this.boardsService.updateBoard(id, dto, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a board (admin only)' })
  remove(@Param('id') id: string) {
    return this.boardsService.remove(id);
  }

  // ─── Members ────────────────────────────────────────────

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List board members' })
  getMembers(@Param('id') id: string) {
    return this.boardsService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a member to the board' })
  addMember(@Param('id') id: string, @Body() dto: AddBoardMemberDto) {
    return this.boardsService.addMember(id, dto);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member role' })
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateBoardMemberDto,
  ) {
    return this.boardsService.updateMember(id, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from the board' })
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.boardsService.removeMember(id, memberId);
  }

  // ─── Pages ──────────────────────────────────────────────

  @Get(':id/pages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List board pages' })
  getPages(@Param('id') id: string) {
    return this.boardsService.getPages(id);
  }

  @Post(':id/pages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a page to the board' })
  addPage(@Param('id') id: string, @Body() dto: CreateBoardPageDto) {
    return this.boardsService.addPage(id, dto);
  }

  @Patch(':id/pages/:pageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update page title or order' })
  updatePage(
    @Param('id') id: string,
    @Param('pageId') pageId: string,
    @Body() dto: UpdateBoardPageDto,
  ) {
    return this.boardsService.updatePage(id, pageId, dto);
  }

  @Delete(':id/pages/:pageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a page and its elements/connectors' })
  removePage(@Param('id') id: string, @Param('pageId') pageId: string) {
    return this.boardsService.removePage(id, pageId);
  }

  // ─── Elements ───────────────────────────────────────────

  @Get(':id/pages/:pageId/elements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all elements for a page' })
  getPageElements(@Param('pageId') pageId: string) {
    return this.boardsService.getPageElements(pageId);
  }

  @Post(':id/pages/:pageId/elements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an element on a page' })
  createElement(
    @Param('pageId') pageId: string,
    @Body() dto: CreateBoardElementDto,
    @Req() req: any,
  ) {
    return this.boardsService.createElement(pageId, dto, req.user.sub);
  }

  @Patch(':id/elements/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update z_index for elements' })
  reorderElements(@Body() dto: ReorderElementsDto) {
    return this.boardsService.reorderElements(dto.items);
  }

  @Patch(':id/elements/:elementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an element' })
  updateElement(
    @Param('elementId') elementId: string,
    @Body() dto: UpdateBoardElementDto,
  ) {
    return this.boardsService.updateElement(elementId, dto);
  }

  @Delete(':id/elements/:elementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an element and its connectors' })
  removeElement(@Param('elementId') elementId: string) {
    return this.boardsService.removeElement(elementId);
  }

  @Post(':id/elements/:elementId/duplicate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate an element' })
  duplicateElement(@Param('elementId') elementId: string, @Req() req: any) {
    return this.boardsService.duplicateElement(elementId, req.user.sub);
  }

  // ─── Connectors ─────────────────────────────────────────

  @Get(':id/pages/:pageId/connectors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all connectors for a page' })
  getPageConnectors(@Param('pageId') pageId: string) {
    return this.boardsService.getPageConnectors(pageId);
  }

  @Post(':id/connectors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a connector between two elements' })
  createConnector(@Body() dto: CreateBoardConnectorDto, @Req() req: any) {
    return this.boardsService.createConnector(dto, req.user.sub);
  }

  @Patch(':id/connectors/:connectorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a connector' })
  updateConnector(
    @Param('connectorId') connectorId: string,
    @Body() dto: UpdateBoardConnectorDto,
  ) {
    return this.boardsService.updateConnector(connectorId, dto);
  }

  @Delete(':id/connectors/:connectorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a connector' })
  removeConnector(@Param('connectorId') connectorId: string) {
    return this.boardsService.removeConnector(connectorId);
  }

  // ─── Chat ───────────────────────────────────────────────

  @Get(':id/chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get board chat messages' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getChatMessages(@Param('id') id: string, @Query() query: any) {
    return this.boardsService.getChatMessages(id, query);
  }

  @Post(':id/chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a chat message' })
  sendChatMessage(
    @Param('id') id: string,
    @Body() dto: CreateBoardChatDto,
    @Req() req: any,
  ) {
    return this.boardsService.sendChatMessage(id, req.user.sub, dto);
  }

  // ─── Comments ───────────────────────────────────────────

  @Get(':id/elements/:elementId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comments for an element' })
  getElementComments(@Param('elementId') elementId: string) {
    return this.boardsService.getElementComments(elementId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment on an element' })
  createComment(@Body() dto: CreateBoardCommentDto, @Req() req: any) {
    return this.boardsService.createComment(dto, req.user.sub);
  }

  @Patch(':id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update or resolve a comment' })
  updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateBoardCommentDto,
  ) {
    return this.boardsService.updateComment(commentId, dto);
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  removeComment(@Param('commentId') commentId: string) {
    return this.boardsService.removeComment(commentId);
  }
}
