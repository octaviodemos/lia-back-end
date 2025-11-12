import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'List of users', type: [UserDto] })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((u) => plainToInstance(UserDto, u));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User info', type: UserDto })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(Number(id));
    return user ? plainToInstance(UserDto, user) : null;
  }
}
