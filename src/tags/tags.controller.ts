import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    create(@Body() body: any) {
        return this.tagsService.create(body);
    }

    @Get()
    findAll() {
        return this.tagsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tagsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.tagsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tagsService.remove(id);
    }
}
