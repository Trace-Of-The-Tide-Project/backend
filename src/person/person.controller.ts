import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PersonService } from './person.service';
import { JwtAuthGuard } from '../auth/jwt/auth.guard';
import { RolesGuard } from '../auth/jwt/roles.guard';

@Controller('people')
@UseGuards(JwtAuthGuard, RolesGuard)
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
