import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PersonService } from './person.service';

@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  create(@Body() body: any) {
    return this.personService.createProfile(body);
  }

  @Get()
  findAll() {
    return this.personService.findAllProfiles();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personService.findProfile(id);
  }
}
