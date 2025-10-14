import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ReactionsService } from './reactions.service';

@Controller('reactions')
export class ReactionsController {
    constructor(private readonly reactionsService: ReactionsService) { }

    @Post()
    create(@Body() body: any) {
        return this.reactionsService.create(body);
    }

    @Get()
    findAll() {
        return this.reactionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reactionsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.reactionsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.reactionsService.remove(id);
    }
}
